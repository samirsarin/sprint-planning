import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import VotingCards from './VotingCards';
import ParticipantGrid from './ParticipantGrid';
import TopicSection from './TopicSection';

const GameRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  
  const [sessionState, setSessionState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const userName = localStorage.getItem('samirsSprint_userName');
        const userId = localStorage.getItem('samirsSprint_userId');

        if (!userName) {
          navigate('/');
          return;
        }

        // Initialize socket connection
        const serverUrl = process.env.NODE_ENV === 'production' 
          ? window.location.origin 
          : 'http://localhost:5000';
        
        socketRef.current = io(serverUrl);
        
        socketRef.current.on('connect', () => {
          setConnected(true);
          console.log('Connected to server');

          // If we have a userId (host rejoining), try to rejoin
          if (userId) {
            socketRef.current.emit('rejoin-session', { sessionId, userId });
          } else {
            // Join as new participant
            socketRef.current.emit('join-session', { sessionId, userName });
          }
        });

        socketRef.current.on('disconnect', () => {
          setConnected(false);
          console.log('Disconnected from server');
        });

        socketRef.current.on('joined-session', (data) => {
          setCurrentUser({
            userId: data.userId,
            sessionId: data.sessionId,
            userName
          });
          setSessionState(data.state);
          setLoading(false);
          localStorage.setItem('samirsSprint_userId', data.userId);
        });

        socketRef.current.on('rejoined-session', (data) => {
          setCurrentUser({
            userId: data.userId,
            sessionId: data.sessionId,
            userName
          });
          setSessionState(data.state);
          setLoading(false);
        });

        socketRef.current.on('session-updated', (newState) => {
          setSessionState(newState);
        });

        socketRef.current.on('error', (errorData) => {
          setError(errorData.message);
          setLoading(false);
        });

        // Check if session exists via API
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }

      } catch (err) {
        setError('Failed to join session. Please check the session ID.');
        setLoading(false);
        console.error('Error initializing session:', err);
      }
    };

    initializeSession();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [sessionId, navigate]);

  const castVote = (vote) => {
    if (socketRef.current && currentUser) {
      socketRef.current.emit('cast-vote', { vote });
    }
  };

  const revealVotes = () => {
    if (socketRef.current && currentUser && isHost()) {
      socketRef.current.emit('reveal-votes');
    }
  };

  const resetVotes = () => {
    if (socketRef.current && currentUser && isHost()) {
      socketRef.current.emit('reset-votes');
    }
  };

  const updateTopic = (topic) => {
    if (socketRef.current && currentUser && isHost()) {
      socketRef.current.emit('update-topic', { topic });
    }
  };

  const isHost = () => {
    return currentUser && sessionState && currentUser.userId === sessionState.hostId;
  };

  const getCurrentUserVote = () => {
    if (!currentUser || !sessionState) return null;
    const participant = sessionState.participants.find(p => p.userId === currentUser.userId);
    return participant?.vote || null;
  };

  const copySessionLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link).then(() => {
      // Could add a toast notification here
      console.log('Link copied to clipboard');
    });
  };

  const getStatusMessage = () => {
    if (!sessionState) return '';
    
    if (sessionState.votesRevealed) {
      return 'Samirstimates revealed! Review the results and start the next round.';
    } else if (sessionState.allVoted) {
      return 'All participants have cast their Samirstimates! Host can reveal them.';
    } else {
      const votedCount = sessionState.participants.filter(p => p.hasVoted).length;
      const totalCount = sessionState.participants.length;
      return `Waiting for Samirstimates... (${votedCount}/${totalCount} estimated)`;
    }
  };

  const getStatusClass = () => {
    if (!sessionState) return 'waiting';
    
    if (sessionState.votesRevealed) {
      return 'revealed';
    } else if (sessionState.allVoted) {
      return 'ready';
    } else {
      return 'waiting';
    }
  };

  if (loading) {
    return <div className="loading">Joining session...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <div className="error-card">
          <h2>Session Error</h2>
          <p>{error}</p>
          <button 
            className="btn" 
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!sessionState || !currentUser) {
    return <div className="loading">Loading session...</div>;
  }

  return (
    <div className="game-room">
      <div className="game-header">
        <h1>Samir's Sprint Planning</h1>
        <div className="session-info">
          <span>Session: {sessionId}</span>
          <span>•</span>
          <span>{sessionState.participants.length} participant{sessionState.participants.length !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span className={connected ? 'connected' : 'disconnected'}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
          <button className="copy-link" onClick={copySessionLink}>
            📋 Copy Link
          </button>
        </div>
      </div>

      <div className="game-content">
        <TopicSection
          topic={sessionState.currentTopic}
          isHost={isHost()}
          onUpdateTopic={updateTopic}
        />

        <div className="status-message">
          <div className={`status-message ${getStatusClass()}`}>
            {getStatusMessage()}
          </div>
        </div>

        <ParticipantGrid
          participants={sessionState.participants}
          votesRevealed={sessionState.votesRevealed}
          currentUserId={currentUser.userId}
        />

        <VotingCards
          selectedVote={getCurrentUserVote()}
          onVote={castVote}
          disabled={sessionState.votesRevealed}
        />

        {isHost() && (
          <div className="host-controls">
            <button
              className="btn btn-reveal"
              onClick={revealVotes}
              disabled={!sessionState.participants.some(p => p.hasVoted)}
            >
              Reveal Samirstimates
            </button>
            <button
              className="btn btn-reset"
              onClick={resetVotes}
            >
              SamiReset (New Round)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoom; 