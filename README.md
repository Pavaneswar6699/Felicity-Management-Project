# Felicity Management Project 🎉

A **comprehensive event management system** built as a full-stack web application for managing large-scale events like Felicity (annual fest at IIITH).

## 🎯 Project Overview
This platform provides end-to-end event management capabilities including event registration, ticketing, schedule management, real-time updates, and participant tracking. It serves both administrators and attendees with intuitive interfaces.

## ✨ Key Features
- 👤 **User Authentication** - Secure login and registration with JWT tokens
- 📝 **Event Management** - Create, edit, and manage multiple events
- 🎫 **Ticketing System** - Generate and validate event tickets
- 📅 **Schedule Management** - Organize events by time slots
- 🔔 **Notifications** - Real-time updates and reminders
- 📊 **Dashboard** - Analytics and reporting
- 🔐 **Role-based Access** - Admin, organizer, and user roles
- 💳 **Payment Integration** - Secure transaction handling
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🌐 **Real-time Updates** - Live event tracking

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Redux/Context API** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3/Tailwind** - Styling
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Socket.io** - Real-time communication

### DevOps & Tools
- **Git** - Version control
- **Docker** - Containerization
- **Postman** - API testing
- **npm/yarn** - Package management

## 📦 Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Pavaneswar6699/Felicity-Management-Project.git
cd Felicity-Management-Project

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env
# Update .env with your configuration

# Start MongoDB service
mongod

# Start backend server (from backend directory)
npm start
# Server runs on http://localhost:5000

# Start frontend dev server (from frontend directory)
npm start
# App runs on http://localhost:3000
```

## 📁 Project Structure
```
Felicity-Management-Project/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API calls
│   │   ├── redux/            # Redux setup
│   │   ├── styles/           # Styling
│   │   └── App.js
│   └── package.json
├── backend/
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API endpoints
│   ├── controllers/          # Business logic
│   ├── middleware/           # Custom middleware
│   ├── config/               # Configuration files
│   ├── server.js             # Entry point
│   └── package.json
├── docs/
│   ├── API.md                # API documentation
│   └── SETUP.md              # Setup guide
└── README.md
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/logout       - User logout
POST   /api/auth/refresh      - Refresh token
```

### Events
```
GET    /api/events            - List all events
GET    /api/events/:id        - Get event details
POST   /api/events            - Create event (Admin)
PUT    /api/events/:id        - Update event
DELETE /api/events/:id        - Delete event
```

### Registrations
```
POST   /api/register          - Register for event
GET    /api/registrations     - User's registrations
DELETE /api/registrations/:id - Cancel registration
```

### Tickets
```
POST   /api/tickets           - Generate ticket
GET    /api/tickets/:id       - Get ticket details
POST   /api/tickets/validate  - Validate ticket
```

## 🚀 Key Functionalities

### For Users
- Browse and search events
- Register for events
- Purchase tickets
- Track registrations
- Receive notifications
- View schedules

### For Administrators
- Create and manage events
- Monitor registrations
- Generate reports
- Manage tickets
- Send announcements
- View analytics

## 🧪 Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test

# API testing with Postman
# Import postman_collection.json
```

## 📊 Database Schema
```
Users:
- userId, email, password, name, role, createdAt

Events:
- eventId, title, description, date, location, capacity

Registrations:
- registrationId, userId, eventId, status, registeredAt

Tickets:
- ticketId, registrationId, ticketNumber, validatedAt
```

## 🔒 Security Features
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Secure session management

## 🚀 Future Enhancements
- [ ] Mobile app (React Native)
- [ ] QR code ticket generation
- [ ] Live streaming integration
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Multi-language support

## 📚 Documentation
- [API Documentation](./docs/API.md)
- [Setup Guide](./docs/SETUP.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🤝 Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License
This project is licensed under the MIT License.

## 👨‍💻 Author
**Pavaneswar** - [GitHub Profile](https://github.com/Pavaneswar6699)

---
⭐ Found this project helpful? Please give it a star!