import React from 'react';

const ParticipantGrid = ({ participants, votesRevealed, currentUserId }) => {
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

  return (
    <div className="participants-section">
      <h3>Participants ({participants.length})</h3>
      <div className="participants-grid">
        {participants.map((participant) => (
          <div
            key={participant.userId}
            className={getParticipantCardClass(participant)}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticipantGrid; 