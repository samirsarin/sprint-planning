# Quick Setup Guide

## 1. Install Node.js

### macOS (recommended method - using Homebrew)
```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

### Alternative: Download from Node.js website
1. Visit https://nodejs.org/
2. Download the LTS version for macOS
3. Run the installer

### Verify installation
```bash
node --version
npm --version
```

## 2. Install Project Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

## 3. Start Development

```bash
# Start both server and client (requires Node.js)
npm run dev
```

OR start them separately:

```bash
# Terminal 1 - Start server
npm run server:dev

# Terminal 2 - Start client
npm run client:dev
```

## 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 5. Test the Application

1. Create a new session
2. Copy the session link
3. Open in another browser/incognito window
4. Join the session
5. Test voting and revealing votes

## Project Structure

```
sprint-planning/
├── package.json           # Root dependencies and scripts
├── server/
│   └── index.js          # Express server with Socket.IO
├── client/
│   ├── package.json      # React dependencies
│   ├── public/
│   │   └── index.html    # HTML template
│   └── src/
│       ├── index.js      # React entry point
│       ├── App.js        # Main app component
│       ├── index.css     # Global styles
│       └── components/   # React components
│           ├── Home.js
│           ├── GameRoom.js
│           ├── VotingCards.js
│           ├── ParticipantGrid.js
│           └── TopicSection.js
└── README.md             # Full documentation
``` 