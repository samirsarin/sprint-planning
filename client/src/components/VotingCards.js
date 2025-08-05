import React from 'react';

const VotingCards = ({ selectedVote, onVote, disabled, votesRevealed }) => {
  // Fibonacci sequence + coffee break card
  const cards = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, '☕'];

  const handleCardClick = (value) => {
    // Users can now edit their votes even after reveal
    if (!disabled) {
      onVote(value);
    }
  };

  return (
    <div className="voting-section">
      <h3>Cast Your Samirstimate</h3>
      <div className="cards-grid">
        {cards.map((value) => (
          <button
            key={value}
            className={`voting-card ${value === '☕' ? 'coffee' : ''} ${
              selectedVote !== null && selectedVote !== undefined && String(selectedVote) === String(value) ? 'selected' : ''
            }`}
            onClick={() => handleCardClick(value)}
            disabled={disabled}
            title={value === '☕' ? 'Samir-Break (Coffee Time!)' : `${value} Samir-Points`}
          >
            {value}
          </button>
        ))}
      </div>
      {votesRevealed && (
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#007bff', fontWeight: 'bold' }}>
          ✏️ You can edit your estimate even after reveal!
        </p>
      )}
      {disabled && !votesRevealed && (
        <p style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
          Samir-voting is paused while estimates are revealed
        </p>
      )}
    </div>
  );
};

export default VotingCards; 