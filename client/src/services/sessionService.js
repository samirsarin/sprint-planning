import { db } from '../firebase';
import { 
  doc, 
  collection, 
  onSnapshot, 
  getDoc,
  getDocs
} from 'firebase/firestore';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Firebase Functions URL in production
  : 'http://localhost:5001/your-project-id/us-central1/api'; // Local emulator

class SessionService {
  constructor() {
    this.listeners = new Map();
  }

  // API calls to Firebase Functions
  async createSession(hostName) {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    return response.json();
  }

  async joinSession(sessionId, userName) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to join session');
    }
    
    return response.json();
  }

  async castVote(sessionId, userId, vote) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, vote }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to cast vote');
    }
    
    return response.json();
  }

  async revealVotes(sessionId, userId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/reveal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reveal votes');
    }
    
    return response.json();
  }

  async resetVotes(sessionId, userId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to reset votes');
    }
    
    return response.json();
  }

  async updateTopic(sessionId, userId, topic) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/topic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, topic }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update topic');
    }
    
    return response.json();
  }

  async leaveSession(sessionId, userId) {
    const response = await fetch(`${API_URL}/sessions/${sessionId}/participants/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to leave session');
    }
    
    return response.json();
  }

  // Real-time listeners using Firestore
  subscribeToSession(sessionId, callback) {
    const sessionRef = doc(db, 'sessions', sessionId);
    const participantsRef = collection(db, 'sessions', sessionId, 'participants');
    
    // Listen to session changes
    const sessionUnsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        this.handleSessionUpdate(doc.data(), sessionId, callback);
      }
    });

    // Listen to participants changes
    const participantsUnsubscribe = onSnapshot(participantsRef, (snapshot) => {
      this.handleParticipantsUpdate(snapshot, sessionId, callback);
    });

    // Store unsubscribe functions
    this.listeners.set(sessionId, {
      session: sessionUnsubscribe,
      participants: participantsUnsubscribe
    });

    return () => this.unsubscribeFromSession(sessionId);
  }

  async handleSessionUpdate(sessionData, sessionId, callback) {
    try {
      // Get current participants
      const participantsSnapshot = await getDocs(collection(db, 'sessions', sessionId, 'participants'));
      const participants = participantsSnapshot.docs.map(doc => doc.data());
      
      const allVoted = participants.length > 0 && participants.every(p => p.hasVoted);
      
      callback({
        ...sessionData,
        participants,
        allVoted
      });
    } catch (error) {
      console.error('Error handling session update:', error);
    }
  }

  async handleParticipantsUpdate(snapshot, sessionId, callback) {
    try {
      // Get session data
      const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
      if (!sessionDoc.exists()) return;
      
      const sessionData = sessionDoc.data();
      const participants = snapshot.docs.map(doc => doc.data());
      const allVoted = participants.length > 0 && participants.every(p => p.hasVoted);
      
      callback({
        ...sessionData,
        participants,
        allVoted
      });
    } catch (error) {
      console.error('Error handling participants update:', error);
    }
  }

  unsubscribeFromSession(sessionId) {
    const listeners = this.listeners.get(sessionId);
    if (listeners) {
      listeners.session();
      listeners.participants();
      this.listeners.delete(sessionId);
    }
  }

  // Clean up all listeners
  cleanup() {
    for (const [sessionId] of this.listeners) {
      this.unsubscribeFromSession(sessionId);
    }
  }
}

export default new SessionService(); 