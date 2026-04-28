require('dotenv').config(); // to get env variables from .env file (where they are hidden for security reasons)
const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Server } = require('socket.io');

// create app
const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",   // Vite default
    "https://duckrollsnrice.vercel.app" // Deployed frontend URL
  ],
  credentials: true
}));
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://duckrollsnrice.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('forum:join', (eventId) => {
    if (eventId) {
      socket.join(`forum:${eventId}`);
    }
  });

  socket.on('forum:leave', (eventId) => {
    if (eventId) {
      socket.leave(`forum:${eventId}`);
    }
  });
});

// connect to database
connectDB();
const PORT = process.env.PORT;
const eventRoutes = require('./routes/events.routes'); // routes are defined in a separate file
const participantRoutes = require('./routes/participants.routes');
const organizerRoutes = require('./routes/organizers.routes');
const adminRoutes = require('./routes/admin.routes');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// middleware to log all incoming and outgoing requests
app.use(express.json()); // to parse json data in request body
app.use((req, res, next) => {
  console.log(req.path, req.method);
  next(); // to pass to next route/middleware
})

// handle routes 
app.use('/api/organizerEvents', eventRoutes);
app.use('/api/participant', participantRoutes);
app.use('/api/organizerLogin', organizerRoutes);
app.use('/api/adminLogin', adminRoutes);

// listen for requests
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})