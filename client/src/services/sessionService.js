import { db } from '../firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Netlify Functions URL in production
  : 'http://localhost:8888/.netlify/functions/api'; // Netlify dev server

class SessionService {
  constructor() {
    this.listeners = new Map();
  }

  // Create session directly in Firestore
  async createSession(hostName) {
    try {
      const hostId = this.generateId();
      const sessionId = this.generateId();
      
      // Create session document
      const sessionRef = doc(db, 'sessions', sessionId);
      await setDoc(sessionRef, {
        sessionId,
        hostId,
        currentTopic: '',
        votesRevealed: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Add host as participant
      const participantRef = doc(db, 'sessions', sessionId, 'participants', hostId);
      await setDoc(participantRef, {
        userId: hostId,
        name: hostName || 'Host',
        vote: null,
        hasVoted: false,
        isHost: true,
        joinedAt: serverTimestamp()
      });
      
      return {
        sessionId,
        hostId
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  // Join session directly in Firestore
  async joinSession(sessionId, userName) {
    try {
      const userId = this.generateId();
      
      // Check if session exists
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionDoc = await getDoc(sessionRef);
      
      if (!sessionDoc.exists()) {
        throw new Error('Session not found');
      }
      
      // Add participant
      const participantRef = doc(db, 'sessions', sessionId, 'participants', userId);
      await setDoc(participantRef, {
        userId,
        name: userName,
        vote: null,
        hasVoted: false,
        isHost: false,
        joinedAt: serverTimestamp()
      });
      
      // Update session timestamp
      await updateDoc(sessionRef, {
        updatedAt: serverTimestamp()
      });
      
      return { userId, sessionId };
    } catch (error) {
      console.error('Error joining session:', error);
      throw new Error('Failed to join session');
    }
  }

  // Cast vote directly in Firestore
  async castVote(sessionId, userId, vote) {
    try {
      const participantRef = doc(db, 'sessions', sessionId, 'participants', userId);
      await updateDoc(participantRef, {
        vote,
        hasVoted: true
      });
      
      // Update session timestamp
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  // Reveal votes
  async revealVotes(sessionId, userId) {
    try {
      // Check if user is host
      const participantRef = doc(db, 'sessions', sessionId, 'participants', userId);
      const participantDoc = await getDoc(participantRef);
      
      if (!participantDoc.exists() || !participantDoc.data().isHost) {
        throw new Error('Only host can reveal votes');
      }
      
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        votesRevealed: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error revealing votes:', error);
      throw error;
    }
  }

  // Reset votes
  async resetVotes(sessionId, userId) {
    try {
      // Check if user is host
      const participantRef = doc(db, 'sessions', sessionId, 'participants', userId);
      const participantDoc = await getDoc(participantRef);
      
      if (!participantDoc.exists() || !participantDoc.data().isHost) {
        throw new Error('Only host can reset votes');
      }
      
      // Reset all participant votes
      const participantsRef = collection(db, 'sessions', sessionId, 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      const updatePromises = participantsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          vote: null,
          hasVoted: false
        })
      );
      
      await Promise.all(updatePromises);
      
      // Reset session
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        votesRevealed: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resetting votes:', error);
      throw error;
    }
  }

  // Update topic
  async updateTopic(sessionId, userId, topic) {
    try {
      // Check if user is host
      const participantRef = doc(db, 'sessions', sessionId, 'participants', userId);
      const participantDoc = await getDoc(participantRef);
      
      if (!participantDoc.exists() || !participantDoc.data().isHost) {
        throw new Error('Only host can update topic');
      }
      
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        currentTopic: topic,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating topic:', error);
      throw error;
    }
  }

  // Throw emoji
  async throwEmoji(sessionId, fromUserId, toUserId, emoji, emojiId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/emoji-throw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        emoji,
        emojiId
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to throw emoji');
    }
    
    return response.json();
  }

  // Listen to session updates
  subscribeToSession(sessionId, callback, emojiCallback) {
    const sessionRef = doc(db, 'sessions', sessionId);
    const participantsRef = collection(db, 'sessions', sessionId, 'participants');
    const emojiThrowsRef = collection(db, 'sessions', sessionId, 'emojiThrows');
    
    // Listen to session data
    const unsubscribeSession = onSnapshot(sessionRef, (sessionDoc) => {
      if (sessionDoc.exists()) {
        // Listen to participants
        const unsubscribeParticipants = onSnapshot(participantsRef, (participantsSnapshot) => {
          const participants = participantsSnapshot.docs.map(doc => doc.data());
          const sessionData = sessionDoc.data();
          
          const state = {
            ...sessionData,
            participants,
            allVoted: participants.length > 0 && participants.every(p => p.hasVoted)
          };
          
          callback(state);
        });
        
        // Listen to emoji throws
        const unsubscribeEmojiThrows = onSnapshot(emojiThrowsRef, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && emojiCallback) {
              const emojiData = change.doc.data();
              console.log('New emoji throw detected:', emojiData);
              // Show all emoji throws (remove time restriction for debugging)
              emojiCallback(emojiData);
            }
          });
        });

        // Store unsubscribe functions
        if (this.listeners.has(sessionId)) {
          const listeners = this.listeners.get(sessionId);
          listeners.participants?.();
          listeners.emojiThrows?.();
        }
        this.listeners.set(sessionId, { 
          session: unsubscribeSession, 
          participants: unsubscribeParticipants,
          emojiThrows: unsubscribeEmojiThrows
        });
      }
    });
    
    return () => this.unsubscribeFromSession(sessionId);
  }

  // Unsubscribe from session updates
  unsubscribeFromSession(sessionId) {
    if (this.listeners.has(sessionId)) {
      const { session, participants, emojiThrows } = this.listeners.get(sessionId);
      session();
      participants();
      emojiThrows?.();
      this.listeners.delete(sessionId);
    }
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

const sessionServiceInstance = new SessionService();
export default sessionServiceInstance; 