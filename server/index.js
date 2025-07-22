const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// In-memory storage for sessions
const sessions = new Map();

class PlanningSession {
  constructor(hostId) {
    this.sessionId = uuidv4();
    this.hostId = hostId;
    this.participants = new Map();
    this.currentTopic = '';
    this.votesRevealed = false;
    this.createdAt = new Date();
  }

  addParticipant(userId, name, isHost = false) {
    this.participants.set(userId, {
      userId,
      name,
      vote: null,
      hasVoted: false,
      isHost,
      connectedAt: new Date()
    });
  }

  removeParticipant(userId) {
    this.participants.delete(userId);
  }

  setVote(userId, vote) {
    const participant = this.participants.get(userId);
    if (participant) {
      participant.vote = vote;
      participant.hasVoted = true;
    }
  }

  revealVotes() {
    this.votesRevealed = true;
  }

  resetVotes() {
    this.votesRevealed = false;
    for (const participant of this.participants.values()) {
      participant.vote = null;
      participant.hasVoted = false;
    }
  }

  setTopic(topic) {
    this.currentTopic = topic;
  }

  getState() {
    return {
      sessionId: this.sessionId,
      hostId: this.hostId,
      participants: Array.from(this.participants.values()),
      currentTopic: this.currentTopic,
      votesRevealed: this.votesRevealed,
      allVoted: this.participants.size > 0 && Array.from(this.participants.values()).every(p => p.hasVoted)
    };
  }
}

// API Routes
app.post('/api/sessions', (req, res) => {
  const { hostName } = req.body;
  const hostId = uuidv4();
  const session = new PlanningSession(hostId);
  session.addParticipant(hostId, hostName || 'Host', true);
  
  sessions.set(session.sessionId, session);
  
  res.json({
    sessionId: session.sessionId,
    hostId: hostId,
    state: session.getState()
  });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({ state: session.getState() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-session', ({ sessionId, userName }) => {
    const session = sessions.get(sessionId);
    
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    const userId = uuidv4();
    session.addParticipant(userId, userName);
    
    socket.userId = userId;
    socket.sessionId = sessionId;
    socket.join(sessionId);
    
    // Emit updated session state to all participants
    io.to(sessionId).emit('session-updated', session.getState());
    
    socket.emit('joined-session', {
      userId,
      sessionId,
      state: session.getState()
    });
  });

  socket.on('rejoin-session', ({ sessionId, userId }) => {
    const session = sessions.get(sessionId);
    
    if (!session || !session.participants.has(userId)) {
      socket.emit('error', { message: 'Session or user not found' });
      return;
    }

    socket.userId = userId;
    socket.sessionId = sessionId;
    socket.join(sessionId);
    
    socket.emit('rejoined-session', {
      userId,
      sessionId,
      state: session.getState()
    });
  });

  socket.on('cast-vote', ({ vote }) => {
    const session = sessions.get(socket.sessionId);
    if (!session || !socket.userId) return;

    session.setVote(socket.userId, vote);
    io.to(socket.sessionId).emit('session-updated', session.getState());
  });

  socket.on('reveal-votes', () => {
    const session = sessions.get(socket.sessionId);
    if (!session || !socket.userId) return;

    // Only host can reveal votes
    const participant = session.participants.get(socket.userId);
    if (!participant || !participant.isHost) return;

    session.revealVotes();
    io.to(socket.sessionId).emit('session-updated', session.getState());
  });

  socket.on('reset-votes', () => {
    const session = sessions.get(socket.sessionId);
    if (!session || !socket.userId) return;

    // Only host can reset votes
    const participant = session.participants.get(socket.userId);
    if (!participant || !participant.isHost) return;

    session.resetVotes();
    io.to(socket.sessionId).emit('session-updated', session.getState());
  });

  socket.on('update-topic', ({ topic }) => {
    const session = sessions.get(socket.sessionId);
    if (!session || !socket.userId) return;

    // Only host can update topic
    const participant = session.participants.get(socket.userId);
    if (!participant || !participant.isHost) return;

    session.setTopic(topic);
    io.to(socket.sessionId).emit('session-updated', session.getState());
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.sessionId && socket.userId) {
      const session = sessions.get(socket.sessionId);
      if (session) {
        session.removeParticipant(socket.userId);
        
        // If no participants left, clean up session after 1 hour
        if (session.participants.size === 0) {
          setTimeout(() => {
            if (sessions.has(socket.sessionId) && sessions.get(socket.sessionId).participants.size === 0) {
              sessions.delete(socket.sessionId);
              console.log('Cleaned up empty session:', socket.sessionId);
            }
          }, 60 * 60 * 1000); // 1 hour
        } else {
          io.to(socket.sessionId).emit('session-updated', session.getState());
        }
      }
    }
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 