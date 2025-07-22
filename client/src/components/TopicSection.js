import React, { useState, useEffect } from 'react';

const TopicSection = ({ topic, isHost, onUpdateTopic }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(topic || '');

  useEffect(() => {
    setEditValue(topic || '');
  }, [topic]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isHost) {
      onUpdateTopic(editValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(topic || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isHost && isEditing) {
    return (
      <div className="topic-section">
        <h2>Current Topic</h2>
        <form onSubmit={handleSubmit} className="topic-input">
          <div className="form-group">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter the user story or topic to estimate..."
              autoFocus
              maxLength={200}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button type="submit" className="btn" style={{ width: 'auto', margin: 0 }}>
              Save
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleCancel}
              style={{ width: 'auto', margin: 0 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="topic-section">
      <h2>Current Topic</h2>
      <div 
        className={`topic-display ${!topic ? 'empty' : ''}`}
        onClick={isHost ? () => setIsEditing(true) : undefined}
        style={{ cursor: isHost ? 'pointer' : 'default' }}
        title={isHost ? 'Click to edit topic' : ''}
      >
        {topic || 'No topic set yet'}
        {isHost && !topic && ' - Click to add a topic'}
      </div>
      {isHost && topic && (
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: '#666' }}>
          Click to edit topic
        </p>
      )}
    </div>
  );
};

export default TopicSection; 