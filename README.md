# Planning Poker - Real-time Collaborative Estimation

🎯 **Now supports FREE deployment with Netlify + Firebase!** 🎯

A modern, real-time Planning Poker application built for agile teams to collaboratively estimate user stories and tasks. Features beautiful UI, instant synchronization, and seamless collaboration.

## 🆓 Free Deployment Options

This app now supports **completely free** deployment using:
- **Frontend**: Netlify (100GB bandwidth, 300 build minutes/month)
- **Backend**: Firebase Functions + Firestore (125K requests, 1GB storage/month)

📖 **[See FREE Setup Guide →](./FREE_SPARK_SETUP.md)** (Recommended - 100% Free!)

📖 **[Alternative Setup Guide →](./FIREBASE_NETLIFY_SETUP.md)** (Requires Firebase Blaze plan)

## 🚀 Features

### Core Functionality
- **Real-time Synchronization**: All actions instantly reflected across all participants
- **Session Management**: Create unique sessions with shareable links
- **User Roles**: Host and Participant roles with different permissions
- **Fibonacci Card Deck**: Standard estimation values (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89) plus coffee break (☕)
- **Topic Management**: Host can set and update the current user story/topic
- **Vote Reveal Control**: Host controls when votes are revealed to all participants

### User Experience
- **Beautiful Modern UI**: Clean, responsive design with smooth animations
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Status**: Live connection status and voting progress
- **Easy Sharing**: One-click session link copying
- **Persistent Sessions**: Rejoin sessions after disconnect/refresh

### Technical Features
- **WebSocket Communication**: Ultra-fast real-time updates via Socket.IO
- **Session Isolation**: Secure, isolated sessions for each team
- **Automatic Cleanup**: Sessions cleaned up when empty
- **Production Ready**: Optimized for deployment on cloud platforms

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **CSS3** - Custom responsive styling with gradients and animations

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **UUID** - Unique session and user ID generation

## 📦 Installation & Setup

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn package manager

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sprint-planning
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```
   This installs dependencies for both server and client.

3. **Start development servers**
   ```bash
   npm run dev
   ```
   This starts both the backend server (port 5000) and React development server (port 3000).

4. **Access the application**
   - Open your browser to `http://localhost:3000`
   - The React app will proxy API requests to the backend server

### Production Build

1. **Build the client**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🚀 Deployment

### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-planning-poker-app
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

The `heroku-postbuild` script will automatically build the React app during deployment.

### AWS Lightsail / DigitalOcean / VPS

1. **Clone repository on server**
   ```bash
   git clone <repository-url>
   cd sprint-planning
   ```

2. **Install dependencies and build**
   ```bash
   npm run install:all
   npm run build
   ```

3. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export PORT=80  # or your preferred port
   ```

4. **Start with process manager (PM2 recommended)**
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name "planning-poker"
   pm2 startup
   pm2 save
   ```

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Configure for full-stack**
   - Add `vercel.json` configuration for API routes and Socket.IO

## 🎮 How to Use

### Creating a Session (Host)
1. Enter your name on the home page
2. Click "Create New Session"
3. Share the generated session link with your team
4. Set the topic/user story to estimate
5. Wait for team members to vote
6. Reveal votes when ready
7. Start new rounds as needed

### Joining a Session (Participant)
1. Enter your name on the home page
2. Paste the session link or enter session ID
3. Click "Join Session"
4. Select your estimate from the card deck
5. Wait for host to reveal votes
6. Participate in discussion and new rounds

### Planning Poker Flow
1. **Set Topic**: Host enters the user story or task to estimate
2. **Vote**: All participants select their estimate secretly
3. **Reveal**: Host reveals all votes simultaneously
4. **Discuss**: Team discusses any discrepancies in estimates
5. **Re-vote**: If needed, host starts a new round
6. **Consensus**: Continue until team reaches consensus

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Server port (default: 5000)

### Customization
- **Card Values**: Modify the `cards` array in `VotingCards.js`
- **Styling**: Update CSS variables in `index.css`
- **Socket Configuration**: Adjust Socket.IO settings in `server/index.js`

## 🔒 Security Features

- **Session Isolation**: Users can only access their joined sessions
- **Host-only Controls**: Only session hosts can reveal votes and reset
- **Input Validation**: All user inputs are validated and sanitized
- **Connection Security**: Socket.IO connections are properly managed
- **No Data Persistence**: Sessions exist only in memory (no database required)

## 🧪 Testing

### Manual Testing Checklist
- [ ] Create new session
- [ ] Join session with multiple users
- [ ] Cast votes with different values
- [ ] Reveal votes as host
- [ ] Reset board for new round
- [ ] Update topic as host
- [ ] Test mobile responsiveness
- [ ] Test disconnect/reconnect scenarios

### Load Testing
The application is designed to handle multiple concurrent sessions with real-time updates. For production use with many teams, consider implementing Redis for session storage and scaling with multiple server instances.

## 📈 Performance Considerations

- **Memory Usage**: Sessions stored in memory; implement database persistence for high-scale usage
- **WebSocket Connections**: Each user maintains one Socket.IO connection
- **Cleanup**: Empty sessions automatically cleaned up after 1 hour
- **Client Optimization**: React app is optimized with production builds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Connection Problems**
- Check if server is running on port 5000
- Verify firewall settings for WebSocket connections
- Ensure CORS is properly configured

**Session Not Found**
- Verify session ID is correct
- Check if session expired (empty for >1 hour)
- Ensure server is running

**Mobile Issues**
- Clear browser cache
- Check if WebSocket connections are supported
- Test on different mobile browsers

### Support
For issues and questions, please create an issue in the repository or contact the development team.

---

Built with ❤️ for agile teams worldwide. 