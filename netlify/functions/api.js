const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
if (!admin.apps.length) {
  try {
    console.log('Initializing Firebase Admin...');
    
    // Check if required environment variables are present
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID', 
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    
    // In production, use environment variables for service account
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

const db = admin.firestore();
const { v4: uuidv4 } = require('uuid');

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

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

exports.handler = async (event, context) => {
  console.log(`Incoming request: ${event.httpMethod} ${event.path}`);
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  
  console.log(`Processing: ${method} ${path}`);
  
  try {
    let response;

    // Route handling
    if (method === 'POST' && path === '/sessions') {
      response = await createSession(JSON.parse(event.body));
    } else if (method === 'GET' && path.startsWith('/sessions/')) {
      const sessionId = path.split('/')[2];
      response = await getSession(sessionId);
    } else if (method === 'POST' && path.includes('/join')) {
      const sessionId = path.split('/')[2];
      response = await joinSession(sessionId, JSON.parse(event.body));
    } else if (method === 'POST' && path.includes('/vote')) {
      const sessionId = path.split('/')[2];
      response = await castVote(sessionId, JSON.parse(event.body));
    } else if (method === 'POST' && path.includes('/reveal')) {
      const sessionId = path.split('/')[2];
      response = await revealVotes(sessionId, JSON.parse(event.body));
    } else if (method === 'POST' && path.includes('/reset')) {
      const sessionId = path.split('/')[2];
      response = await resetVotes(sessionId, JSON.parse(event.body));
    } else if (method === 'POST' && path.includes('/topic')) {
      const sessionId = path.split('/')[2];
      response = await updateTopic(sessionId, JSON.parse(event.body));
    } else if (method === 'DELETE' && path.includes('/participants/')) {
      const pathParts = path.split('/');
      const sessionId = pathParts[2];
      const userId = pathParts[4];
      response = await removeParticipant(sessionId, userId);
    } else if (method === 'POST' && path.includes('/emoji-throw')) {
      const sessionId = path.split('/')[2];
      response = await handleEmojiThrow(sessionId, JSON.parse(event.body));
    } else if (method === 'GET' && path === '/health') {
      response = { status: 'ok', timestamp: new Date().toISOString() };
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

// API Functions
async function createSession(body) {
  const { hostName } = body;
  const hostId = uuidv4();
  const sessionData = createSessionData(hostId, hostName || 'Host');
  
  // Create session document
  const sessionRef = db.collection('sessions').doc(sessionData.sessionId);
  await sessionRef.set(sessionData);
  
  // Add host as participant
  const participantData = createParticipantData(hostId, hostName || 'Host', true);
  await sessionRef.collection('participants').doc(hostId).set(participantData);
  
  return {
    sessionId: sessionData.sessionId,
    hostId: hostId
  };
}

async function getSession(sessionId) {
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();
  
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }
  
  // Get participants
  const participantsSnapshot = await sessionRef.collection('participants').get();
  const participants = participantsSnapshot.docs.map(doc => doc.data());
  
  const sessionData = sessionDoc.data();
  const allVoted = participants.length > 0 && participants.every(p => p.hasVoted);
  
  return {
    ...sessionData,
    participants,
    allVoted
  };
}

async function joinSession(sessionId, body) {
  const { userName } = body;
  const userId = uuidv4();
  
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionDoc = await sessionRef.get();
  
  if (!sessionDoc.exists) {
    throw new Error('Session not found');
  }
  
  // Add participant
  const participantData = createParticipantData(userId, userName);
  await sessionRef.collection('participants').doc(userId).set(participantData);
  
  // Update session timestamp
  await sessionRef.update({
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { userId, sessionId };
}

async function castVote(sessionId, body) {
  const { userId, vote } = body;
  
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
  
  return { success: true };
}

async function revealVotes(sessionId, body) {
  const { userId } = body;
  
  const sessionRef = db.collection('sessions').doc(sessionId);
  const participantRef = sessionRef.collection('participants').doc(userId);
  const participantDoc = await participantRef.get();
  
  if (!participantDoc.exists || !participantDoc.data().isHost) {
    throw new Error('Only host can reveal votes');
  }
  
  await sessionRef.update({
    votesRevealed: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
}

async function resetVotes(sessionId, body) {
  const { userId } = body;
  
  const sessionRef = db.collection('sessions').doc(sessionId);
  const participantRef = sessionRef.collection('participants').doc(userId);
  const participantDoc = await participantRef.get();
  
  if (!participantDoc.exists || !participantDoc.data().isHost) {
    throw new Error('Only host can reset votes');
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
  
  return { success: true };
}

async function updateTopic(sessionId, body) {
  const { userId, topic } = body;
  
  const sessionRef = db.collection('sessions').doc(sessionId);
  const participantRef = sessionRef.collection('participants').doc(userId);
  const participantDoc = await participantRef.get();
  
  if (!participantDoc.exists || !participantDoc.data().isHost) {
    throw new Error('Only host can update topic');
  }
  
  await sessionRef.update({
    currentTopic: topic,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
}

async function removeParticipant(sessionId, userId) {
  const sessionRef = db.collection('sessions').doc(sessionId);
  const participantRef = sessionRef.collection('participants').doc(userId);
  
  await participantRef.delete();
  
  // Update session timestamp
  await sessionRef.update({
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
}

async function handleEmojiThrow(sessionId, body) {
  const { fromUserId, toUserId, emoji, emojiId } = body;
  
  const sessionRef = db.collection('sessions').doc(sessionId);
  
  // Store emoji throw in Firestore for real-time sync
  const emojiThrowData = {
    id: emojiId,
    fromUserId,
    toUserId,
    emoji,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  };
  
  await sessionRef.collection('emojiThrows').doc(emojiId.toString()).set(emojiThrowData);
  
  // Update session timestamp to trigger listeners
  await sessionRef.update({
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true };
} 