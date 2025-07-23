import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionService from '../services/sessionService';

const Home = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createSession = async (e) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await sessionService.createSession(hostName.trim());
      
      // Store host info in localStorage
      localStorage.setItem('samirsSprint_userId', data.hostId);
      localStorage.setItem('samirsSprint_userName', hostName.trim());
      
      navigate(`/room/${data.sessionId}`);
    } catch (err) {
      setError('Failed to create session. Please try again.');
      console.error('Error creating session:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = (e) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!sessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    // Store user info in localStorage
    localStorage.setItem('samirsSprint_userName', joinName.trim());
    localStorage.removeItem('samirsSprint_userId'); // Clear any existing userId
    
    navigate(`/room/${sessionId.trim()}`);
  };

  const extractSessionIdFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const roomIndex = pathParts.indexOf('room');
      if (roomIndex !== -1 && pathParts[roomIndex + 1]) {
        return pathParts[roomIndex + 1];
      }
    } catch (err) {
      // Not a valid URL, check if it's just a session ID
      if (url.trim().length > 0) {
        return url.trim();
      }
    }
    return '';
  };

  const handleSessionIdChange = (e) => {
    const input = e.target.value;
    const extractedId = extractSessionIdFromUrl(input);
    setSessionId(extractedId);
  };

  return (
    <div className="home">
      <div className="container">
        <div className="home-card">
          <h1>Samir's Sprint Planning</h1>
          <p>The ultimate story estimation experience - collaborative, real-time, and Samirific!</p>

          {error && (
            <div className="status-message waiting">
              {error}
            </div>
          )}

          <form onSubmit={createSession}>
            <div className="form-group">
              <label htmlFor="hostName">Your Name</label>
              <input
                id="hostName"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>
            <button 
              type="submit" 
              className="btn"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create New Session'}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={joinSession}>
            <div className="form-group">
              <label htmlFor="joinName">Your Name</label>
              <input
                id="joinName"
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <label htmlFor="sessionId">Session Link or ID</label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={handleSessionIdChange}
                placeholder="Paste session link or enter session ID"
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary"
              disabled={loading}
            >
              Join Session
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home; 