import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import sessionService from '../services/sessionService';
import VotingCards from './VotingCards';
import ParticipantGrid from './ParticipantGrid';
import TopicSection from './TopicSection';

const GameRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [sessionState, setSessionState] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const emojiHandlerRef = useRef(null);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const userName = localStorage.getItem('samirsSprint_userName');
        const userId = localStorage.getItem('samirsSprint_userId');

        if (!userName) {
          navigate('/');
          return;
        }

        // Set current user info
        setCurrentUser({
          userId: userId || null,
          sessionId,
          userName
        });

        if (userId) {
          // User is rejoining (likely the host)
          console.log('User rejoining session');
        } else {
          // Join as new participant
          console.log('Joining as new participant');
          const joinResult = await sessionService.joinSession(sessionId, userName);
          localStorage.setItem('samirsSprint_userId', joinResult.userId);
          setCurrentUser({
            userId: joinResult.userId,
            sessionId,
            userName
          });
        }

        // Subscribe to session updates
        sessionService.subscribeToSession(sessionId, (newState) => {
          console.log('Session state updated:', newState);
          setSessionState(newState);
          setLoading(false);
        }, (emojiData) => {
          // Handle incoming emoji throws
          if (emojiHandlerRef.current) {
            emojiHandlerRef.current(emojiData);
          }
        });

      } catch (err) {
        setError('Failed to join session. Please check the session ID.');
        setLoading(false);
        console.error('Error initializing session:', err);
      }
    };

    initializeSession();

    return () => {
      // Clean up listeners when component unmounts
      sessionService.unsubscribeFromSession(sessionId);
    };
  }, [sessionId, navigate]);

  const castVote = async (vote) => {
    if (currentUser) {
      try {
        await sessionService.castVote(sessionId, currentUser.userId, vote);
      } catch (error) {
        console.error('Error casting vote:', error);
      }
    }
  };

  const revealVotes = async () => {
    if (currentUser && isHost()) {
      try {
        await sessionService.revealVotes(sessionId, currentUser.userId);
      } catch (error) {
        console.error('Error revealing votes:', error);
      }
    }
  };

  const resetVotes = async () => {
    if (currentUser && isHost()) {
      try {
        await sessionService.resetVotes(sessionId, currentUser.userId);
      } catch (error) {
        console.error('Error resetting votes:', error);
      }
    }
  };

  const updateTopic = async (topic) => {
    if (currentUser && isHost()) {
      try {
        await sessionService.updateTopic(sessionId, currentUser.userId, topic);
      } catch (error) {
        console.error('Error updating topic:', error);
      }
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
          <span className="connected">
            🟢 Connected
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
          onEmojiThrow={emojiHandlerRef}
        />

        <VotingCards
          selectedVote={getCurrentUserVote()}
          onVote={castVote}
          disabled={false}
          votesRevealed={sessionState.votesRevealed}
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