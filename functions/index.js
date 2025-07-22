const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper function to create session data structure
function createSessionData(hostId, hostName) {
  return {
    sessionId: uuidv4(),
    hostId: hostId,
    currentTopic: '',
    votesRevealed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// Helper function to create participant data
function createParticipantData(userId, name, isHost = false) {
  return {
    userId,
    name,
    vote: null,
    hasVoted: false,
    isHost,
    joinedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

// API Routes

// Create a new planning session
app.post('/sessions', async (req, res) => {
  try {
    const { hostName } = req.body;
    const hostId = uuidv4();
    const sessionData = createSessionData(hostId, hostName || 'Host');
    
    // Create session document
    const sessionRef = db.collection('sessions').doc(sessionData.sessionId);
    await sessionRef.set(sessionData);
    
    // Add host as participant
    const participantData = createParticipantData(hostId, hostName || 'Host', true);
    await sessionRef.collection('participants').doc(hostId).set(participantData);
    
    res.json({
      sessionId: sessionData.sessionId,
      hostId: hostId
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session data
app.get('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get participants
    const participantsSnapshot = await sessionRef.collection('participants').get();
    const participants = participantsSnapshot.docs.map(doc => doc.data());
    
    const sessionData = sessionDoc.data();
    const allVoted = participants.length > 0 && participants.every(p => p.hasVoted);
    
    res.json({
      ...sessionData,
      participants,
      allVoted
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// Join a session
app.post('/sessions/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userName } = req.body;
    const userId = uuidv4();
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();
    
    if (!sessionDoc.exists) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add participant
    const participantData = createParticipantData(userId, userName);
    await sessionRef.collection('participants').doc(userId).set(participantData);
    
    // Update session timestamp
    await sessionRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ userId, sessionId });
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Cast a vote
app.post('/sessions/:sessionId/vote', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, vote } = req.body;
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const participantRef = sessionRef.collection('participants').doc(userId);
    
    await participantRef.update({
      vote: vote,
      hasVoted: true
    });
    
    // Update session timestamp
    await sessionRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Reveal votes (host only)
app.post('/sessions/:sessionId/reveal', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const participantRef = sessionRef.collection('participants').doc(userId);
    const participantDoc = await participantRef.get();
    
    if (!participantDoc.exists || !participantDoc.data().isHost) {
      return res.status(403).json({ error: 'Only host can reveal votes' });
    }
    
    await sessionRef.update({
      votesRevealed: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error revealing votes:', error);
    res.status(500).json({ error: 'Failed to reveal votes' });
  }
});

// Reset votes (host only)
app.post('/sessions/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const participantRef = sessionRef.collection('participants').doc(userId);
    const participantDoc = await participantRef.get();
    
    if (!participantDoc.exists || !participantDoc.data().isHost) {
      return res.status(403).json({ error: 'Only host can reset votes' });
    }
    
    // Reset all participant votes
    const participantsSnapshot = await sessionRef.collection('participants').get();
    const batch = db.batch();
    
    participantsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        vote: null,
        hasVoted: false
      });
    });
    
    batch.update(sessionRef, {
      votesRevealed: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await batch.commit();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting votes:', error);
    res.status(500).json({ error: 'Failed to reset votes' });
  }
});

// Update topic (host only)
app.post('/sessions/:sessionId/topic', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, topic } = req.body;
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const participantRef = sessionRef.collection('participants').doc(userId);
    const participantDoc = await participantRef.get();
    
    if (!participantDoc.exists || !participantDoc.data().isHost) {
      return res.status(403).json({ error: 'Only host can update topic' });
    }
    
    await sessionRef.update({
      currentTopic: topic,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating topic:', error);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Remove participant when they leave
app.delete('/sessions/:sessionId/participants/:userId', async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    
    const sessionRef = db.collection('sessions').doc(sessionId);
    const participantRef = sessionRef.collection('participants').doc(userId);
    
    await participantRef.delete();
    
    // Update session timestamp
    await sessionRef.update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cloud Function to clean up old sessions
exports.cleanupSessions = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24); // Delete sessions older than 24 hours
  
  const sessionsSnapshot = await db.collection('sessions')
    .where('updatedAt', '<', cutoff)
    .get();
  
  const batch = db.batch();
  
  for (const sessionDoc of sessionsSnapshot.docs) {
    // Delete participants subcollection
    const participantsSnapshot = await sessionDoc.ref.collection('participants').get();
    participantsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete session document
    batch.delete(sessionDoc.ref);
  }
  
  await batch.commit();
  console.log(`Cleaned up ${sessionsSnapshot.size} old sessions`);
});

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app); 