# Felicity Management Project

A **full-stack event management platform** built with the **MERN stack** (MongoDB, Express, React, Node.js) designed to streamline college festival operations. This comprehensive solution handles participant registration, organizer workflows, merchandise sales, real-time collaboration, and event analytics.

---

## 🎯 Project Overview

**Felicity Management Project** is a production-ready event management system that powers college festivals and large-scale events. It provides:

- 🎟️ **Participant Features**: Event discovery with fuzzy search, easy registration, ticket scanning, and real-time discussion forums
- 👨‍💼 **Organizer Features**: Event creation, merchandise management, payment approval workflows, QR-based attendance tracking, and analytics dashboards
- 🛡️ **Secure Infrastructure**: JWT-based authentication, role-based access control, and secure payment verification
- ⚡ **Real-Time Capabilities**: WebSocket-powered discussion forums and live collaboration
- 📱 **Calendar Integration**: Sync events to Apple Calendar, Google Calendar, and Outlook

---

## 📊 Tech Stack

### Frontend
- **React 19** - Component-based UI framework with modern hooks
- **React Router 7** - Client-side SPA routing
- **Vite** - Lightning-fast build tool with HMR
- **Fuse.js** - Fuzzy search functionality
- **Socket.io Client** - Real-time WebSocket communication
- **HTML5 QR Code** - Browser-based QR scanning
- **Vanilla CSS** - Custom styling for complete design control

**Language Composition**: JavaScript (88.5%), CSS (11.4%), HTML (0.1%)

### Backend
- **Node.js + Express 5** - RESTful API server
- **MongoDB + Mongoose** - Document database with schema validation
- **JWT** - Stateless authentication
- **Bcrypt** - Secure password hashing
- **Socket.io** - WebSocket server for real-time features
- **Cloudinary** - Cloud file hosting for uploads
- **Postmark** - Automated email delivery
- **QR Code** - Ticket QR generation
- **ICS** - iCalendar file generation

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Cloudinary account (for file uploads)
- Postmark account (for email delivery)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Pavaneswar6699/Felicity-Management-Project.git
   cd Felicity-Management-Project
   ```

2. **Backend Setup:**
   ```bash
   cd Felicity_Management_Website-master/backend
   npm install
   ```
   Create `.env` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   POSTMARK_TOKEN=your_postmark_token
   PORT=5000
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Run Development Servers:**
   ```bash
   # Terminal 1 - Backend
   cd Felicity_Management_Website-master/backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd Felicity_Management_Website-master/frontend
   npm run dev
   ```

   - Backend runs on: `http://localhost:5000`
   - Frontend runs on: `http://localhost:5173` (Vite default)

---

## 🌐 Deployment

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | Vercel | React/Vite deployment with global CDN, automatic HTTPS, and CI/CD |
| **Backend** | Railway | Node.js PaaS with native WebSocket support and environment management |
| **Database** | MongoDB Atlas | Managed MongoDB with automatic backups and scaling |

---

## ✨ Key Features

### Tier A: Core Features
- **Merchandise Payment Approval Workflow**: Secure payment verification before inventory deduction
- **QR Scanner & Attendance Tracking**: Instant ticket validation and real-time attendance updates

### Tier B: Advanced Features
- **Real-Time Discussion Forum**: WebSocket-powered participant-organizer communication
- **Organizer Password Reset**: Admin-managed account recovery with audit trails

### Tier C: Premium Features
- **Event Analytics Dashboard**: Dynamic attendance rates, registration trends, and insights
- **Fuzzy Search & Filtering**: Client-side search with typo tolerance for event discovery
- **Calendar Integration**: Export events to .ics, Google Calendar, or Outlook

---

## 📁 Project Structure

```
Felicity-Management-Project/
├── Felicity_Management_Website-master/
│   ├── frontend/                 # React SPA application
│   │   ├── src/
│   │   ├── package.json
│   │   └── vite.config.js
│   ├── backend/                  # Express API server
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── server.js
│   │   └── package.json
│   └── README.md
└── README.md                     # This file
```

---

## 🔐 Authentication & Security

- **JWT Tokens**: Stateless authentication with expiring tokens
- **Password Hashing**: bcrypt for secure password storage
- **Role-Based Access Control**: Participant and Organizer roles with specific permissions
- **CORS Configuration**: Secure cross-origin requests
- **Environment Variables**: Sensitive data kept out of source code

---

## 💻 Available Scripts

### Backend
```bash
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## 📧 Email Integration

The project uses **Postmark** for reliable email delivery:
- Ticket generation and delivery
- Password reset notifications
- Registration status updates
- Event reminders

---

## 🎨 UI/UX Highlights

- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile
- **Custom Theming**: Vanilla CSS with cohesive color schemes
- **Accessible Forms**: Clear validation and user feedback
- **Real-Time Updates**: Live forum and attendance tracking
- **QR Scanner**: Device camera integration for ticket validation

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

ISC License - See individual package.json files for details

---

## 👨‍💻 Author

**Kartikeya** - Backend development

---

## 📞 Support & Contact

For issues, questions, or suggestions:
- Open an [GitHub Issue](https://github.com/Pavaneswar6699/Felicity-Management-Project/issues)
- Check existing documentation in the project folders

---

## 🎉 Acknowledgments

Built as a comprehensive event management solution for modern college festivals with scalability, security, and user experience in mind.

---

**Last Updated**: April 28, 2026
