import React, { useState } from 'react';

const ParticipantGrid = ({ participants, votesRevealed, currentUserId }) => {
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  
  const emojis = ['🎯', '🚀', '⭐', '🎉', '🔥', '💫', '✨', '🌟', '💥', '🎊'];
  
  const throwEmojiAt = (targetUserId) => {
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const emojiId = Date.now() + Math.random();
    
    // Get source and target positions
    const sourceElement = document.querySelector(`[data-user-id="${currentUserId}"]`);
    const targetElement = document.querySelector(`[data-user-id="${targetUserId}"]`);
    
    if (sourceElement && targetElement) {
      const sourceRect = sourceElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      
      const newEmoji = {
        id: emojiId,
        emoji: randomEmoji,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
      };
      
      setFlyingEmojis(prev => [...prev, newEmoji]);
      
      // Remove emoji after animation completes
      setTimeout(() => {
        setFlyingEmojis(prev => prev.filter(e => e.id !== emojiId));
      }, 1000);
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
                title={`Throw emoji at ${participant.name}`}
              >
                🎯
              </button>
            )}
          </div>
        ))}
      </div>
      {renderVotingStats()}
      
      {/* Flying Emojis */}
      {flyingEmojis.map((flyingEmoji) => (
        <div
          key={flyingEmoji.id}
          className="flying-emoji"
          style={{
            '--start-x': `${flyingEmoji.startX}px`,
            '--start-y': `${flyingEmoji.startY}px`,
            '--end-x': `${flyingEmoji.endX}px`,
            '--end-y': `${flyingEmoji.endY}px`,
          }}
        >
          {flyingEmoji.emoji}
        </div>
      ))}
    </div>
  );
};

export default ParticipantGrid; 