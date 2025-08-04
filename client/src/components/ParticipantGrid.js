import React, { useState, useCallback } from 'react';
import sessionService from '../services/sessionService';

const ParticipantGrid = ({ participants, votesRevealed, currentUserId, onEmojiThrow }) => {
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  
  // To use your custom image:
  // 1. Save your image as 'samir.jpg' in client/public/ folder
  // 2. Change the line below to: const throwImage = '/samir.jpg';
  
  // For now, using a fallback emoji until you add your image
  const throwImage = null; // This will trigger the emoji fallback
  
    // Function to handle incoming emoji throws from other users
  const handleIncomingEmojiThrow = useCallback((emojiData) => {
    console.log('Handling incoming emoji throw:', emojiData);
    
    // Don't show emoji throws from yourself
    if (emojiData.fromUserId === currentUserId) {
      console.log('Ignoring emoji from self');
      return;
    }
    
    const sourceElement = document.querySelector(`[data-user-id="${emojiData.fromUserId}"]`);
    
    if (sourceElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      
      const newEmoji = {
        id: emojiData.emojiId,
        image: throwImage,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        horizontalOffset: (Math.random() - 0.5) * 200,
        rotation: Math.random() * 360,
      };
      
      console.log('Adding flying emoji:', newEmoji);
      setFlyingEmojis(prev => [...prev, newEmoji]);
      
      setTimeout(() => {
        setFlyingEmojis(prev => prev.filter(e => e.id !== emojiData.emojiId));
      }, 3000);
    } else {
      console.log('Source element not found for user:', emojiData.fromUserId);
    }
  }, [currentUserId]);

  // Expose the handler to parent component
  React.useEffect(() => {
    if (onEmojiThrow) {
      onEmojiThrow.current = handleIncomingEmojiThrow;
    }
  }, [onEmojiThrow, handleIncomingEmojiThrow]);
  
  const throwEmojiAt = async (targetUserId) => {
    const emojiId = Date.now() + Math.random();
    
    // Get source element position
    const sourceElement = document.querySelector(`[data-user-id="${currentUserId}"]`);
    
    if (sourceElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      
      // Create image that launches up and falls down
      const newEmoji = {
        id: emojiId,
        image: throwImage,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        // Random horizontal spread
        horizontalOffset: (Math.random() - 0.5) * 200,
        // Random rotation
        rotation: Math.random() * 360,
      };
      
      setFlyingEmojis(prev => [...prev, newEmoji]);
      
      // Remove emoji after animation completes (3 seconds for full fall)
      setTimeout(() => {
        setFlyingEmojis(prev => prev.filter(e => e.id !== emojiId));
      }, 3000);
      
      // Send emoji throw to other users via session service
      try {
        const sessionId = window.location.pathname.split('/').pop();
        await sessionService.throwEmoji(sessionId, currentUserId, targetUserId, throwImage, emojiId);
      } catch (error) {
        console.error('Failed to send emoji throw:', error);
      }
    }
  };

  const getParticipantInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  const getParticipantStatus = (participant) => {
    if (participant.isHost) {
      return 'Host';
    } else if (participant.hasVoted) {
      return 'Voted';
    } else {
      return 'Waiting';
    }
  };

  const getParticipantCardClass = (participant) => {
    let classes = 'participant-card';
    
    if (participant.isHost) {
      classes += ' host';
    } else if (participant.hasVoted) {
      classes += ' voted';
    }
    
    return classes;
  };

  const renderVote = (participant) => {
    if (!votesRevealed || !participant.hasVoted) {
      return null;
    }

    return (
      <div className={`participant-vote ${participant.vote === '☕' ? 'coffee' : ''}`}>
        {participant.vote}
      </div>
    );
  };

  const calculateVotingStats = () => {
    if (!votesRevealed) return null;

    const votedParticipants = participants.filter(p => p.hasVoted);
    if (votedParticipants.length === 0) return null;

    // Get numeric votes (exclude coffee breaks)
    const numericVotes = votedParticipants
      .map(p => p.vote)
      .filter(vote => vote !== '☕' && !isNaN(vote))
      .map(vote => Number(vote));

    if (numericVotes.length === 0) {
      return {
        totalVotes: votedParticipants.length,
        numericVotes: 0,
        coffeeBreaks: votedParticipants.filter(p => p.vote === '☕').length,
        average: null,
        min: null,
        max: null
      };
    }

    const average = numericVotes.reduce((sum, vote) => sum + vote, 0) / numericVotes.length;
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    const coffeeBreaks = votedParticipants.filter(p => p.vote === '☕').length;

    return {
      totalVotes: votedParticipants.length,
      numericVotes: numericVotes.length,
      coffeeBreaks,
      average: Math.round(average * 10) / 10, // Round to 1 decimal place
      min,
      max,
      votes: numericVotes
    };
  };

  const renderVotingStats = () => {
    const stats = calculateVotingStats();
    if (!stats) return null;

    return (
      <div className="voting-stats">
        <h4>📊 Samirstimate Results</h4>
        <div className="stats-grid">
          {stats.average !== null && (
            <div className="stat-item">
              <div className="stat-label">Average</div>
              <div className="stat-value average">{stats.average}</div>
            </div>
          )}
          {stats.min !== null && (
            <div className="stat-item">
              <div className="stat-label">Min</div>
              <div className="stat-value">{stats.min}</div>
            </div>
          )}
          {stats.max !== null && (
            <div className="stat-item">
              <div className="stat-label">Max</div>
              <div className="stat-value">{stats.max}</div>
            </div>
          )}
          <div className="stat-item">
            <div className="stat-label">Votes</div>
            <div className="stat-value">{stats.numericVotes}</div>
          </div>
          {stats.coffeeBreaks > 0 && (
            <div className="stat-item">
              <div className="stat-label">☕ Breaks</div>
              <div className="stat-value">{stats.coffeeBreaks}</div>
            </div>
          )}
        </div>
        {stats.numericVotes > 1 && (
          <div className="consensus-indicator">
            {stats.min === stats.max ? (
              <div className="consensus good">🎯 Perfect Consensus!</div>
            ) : stats.max - stats.min <= 3 ? (
              <div className="consensus okay">👍 Good Consensus</div>
            ) : (
              <div className="consensus poor">💬 Discussion Needed</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="participants-section">
      <h3>Participants ({participants.length})</h3>
      <div className="participants-grid">
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className={getParticipantCardClass(participant)}
            data-user-id={participant.userId}
          >
            <div className="participant-avatar">
              {getParticipantInitials(participant.name)}
            </div>
            <div className="participant-name">
              {participant.name}
              {participant.userId === currentUserId && ' (You)'}
            </div>
            <div className="participant-status">
              {getParticipantStatus(participant)}
            </div>
            {renderVote(participant)}
            {participant.userId !== currentUserId && (
              <button
                className="emoji-throw-btn"
                onClick={() => throwEmojiAt(participant.userId)}
                title={`Throw image at ${participant.name}`}
              >
                📸
              </button>
            )}
          </div>
        ))}
      </div>
      {renderVotingStats()}
      
      {/* Flying Images */}
      {flyingEmojis.map((flyingEmoji) => (
        <div
          key={flyingEmoji.id}
          className="flying-emoji-gravity"
          style={{
            '--start-x': `${flyingEmoji.startX}px`,
            '--start-y': `${flyingEmoji.startY}px`,
            '--horizontal-offset': `${flyingEmoji.horizontalOffset}px`,
            '--rotation': `${flyingEmoji.rotation}deg`,
          }}
        >
          {flyingEmoji.image ? (
            <>
              <img 
                src={flyingEmoji.image} 
                alt="🎯" 
                className="flying-image"
                onError={(e) => {
                  // If image fails to load, show emoji as fallback
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div 
                className="emoji-fallback"
                style={{display: 'none', fontSize: '40px'}}
              >
                🎯
              </div>
            </>
          ) : (
            <div 
              className="emoji-fallback"
              style={{fontSize: '40px'}}
            >
              🎯
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ParticipantGrid; 