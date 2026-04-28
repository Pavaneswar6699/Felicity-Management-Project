# Felicity Management Website

A comprehensive MERN-stack event management platform built for college festivals. This platform supports participant registration, organizer management, merchandise sales, and real-time collaboration.

## Setup and Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for file uploads)

### Running the Project Locally
The project is divided into two parts: `frontend` and `backend`. You will need to run them simultaneously in two separate terminals.

1. **Clone the repository and install dependencies:**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm install

   # Terminal 2 (Frontend)
   cd frontend
   npm install
   ```

2. **Environment Variables:**
   - Create a `.env` file in the `backend` folder and configure your MongoDB URI, Cloudinary credentials, Nodemailer SMTP details, and JWT secret.
   - Create a `.env` file in the `frontend` folder (if any `VITE_` variables are required).

3. **Start the development servers:**
   ```bash
   # Terminal 1 (Backend)
   npm run dev

   # Terminal 2 (Frontend)
   npm run dev
   ```
   The backend will start using `nodemon`, and the frontend will use `vite`. 

---

## Deployment

- **Frontend:** Deployed and actively hosted on **Vercel** ([Link]). 
    *Justification*: Vercel offers zero-configuration deployment for Vite/React applications with out-of-the-box global CDN caching, automatic HTTPS, and seamless continuous integration with GitHub.
- **Backend:** Deployed and actively hosted on **Railway** ([Link]). 
    *Justification*: Railway provides a straightforward, developer-friendly PaaS for Node.js backends with automated builds, native WebSocket (Socket.io) handling, and easy environment variable injection without complex Docker configurations.
- **Database:** Hosted on **MongoDB Atlas**, connected via backend environment variables. 
    *Justification*: Atlas is the officially managed DBaaS for MongoDB, ensuring high availability, automatic backups, and seamless scaling without local infrastructure overhead.

---

## Technical Stack & Libraries Used

### Frontend
- **React (`react`, `react-dom`)**: Used for building a component-based, highly interactive UI framework. 
- **React Router (`react-router-dom`)**: Used for seamless client-side single-page application (SPA) routing without page reloads.
- **Vite (`vite`)**: Chosen as the build tool over Create-React-App for its significantly faster Hot Module Replacement (HMR) and optimized build performance.
- **Fuse.js (`fuse.js`)**: Included to provide powerful, lightweight fuzzy-search capabilities on the "Browse Events" page, matching partial names and typos gracefully.
- **Socket.io Client (`socket.io-client`)**: Required for bidirectional WebSocket communication to power the real-time discussion forum.
- **HTML5 QR Code (`html5-qrcode`)**: Empowers organizers to scan participant tickets directly from their device browsers using the device camera.
- **Vanilla CSS (`index.css`)**: Used for styling the application instead of external UI frameworks. Justification: Provides full control over customizing a dynamic, cohesive theme without bloating the bundle size with unused utility classes or predefined components.

### Backend
- **Express.js (`express`)**: A minimalist Node.js web framework chosen for its simplicity in setting up robust RESTful API routing and middlewear support.
- **Mongoose & MongoDB (`mongoose`, `mongodb`)**: Used as the ODM/Database. Mongoose provides straightforward schema validation, type casting, and relationship mapping between Events, Users, and Registrations.
- **JSON Web Tokens (`jsonwebtoken`)**: Used for stateless, secure user authentication and session management.
- **Bcrypt (`bcrypt`)**: Used for one-way password hashing to securely store passwords in the database.
- **Socket.io (`socket.io`)**: Used for the backend WebSocket server to handle real-time messaging events in the discussion forum.
- **Multer & Cloudinary (`multer`, `cloudinary`)**: Multer parses `multipart/form-data`, and Cloudinary handles the actual cloud hosting of uploaded payment proofs and event banners, preventing local disk space exhaustion.
- **Postmark (`postmark`)**: Used for reliable automated email delivery (e.g., tickets, password resets, registration statuses) via API. Postmark works reliably on Railway for production deployments, natively replacing the previous SMTP-based Nodemailer setup.
- **QR Code (`qrcode`)**: Generates custom Base64 QR code image data representing ticket IDs, which are embedded into email tickets.
- **ICS (`ics`)**: Creates standard standard iCalendar `.ics` files for event schedule integrations.

---

## Advanced Features Implemented

### Tier A Features

**1. Merchandise Payment Approval Workflow**
- **Justification**: Merchandise has limited physical stock. Open registration would immediately deplete stock. Organizers must verify payment proof before reserving an item.
- **Design Choices & Implementation**: Participants are allowed to register by uploading a screenshot/proof of payment. The registration is marked "Pending", and no stock is deducted. Organizers review the proof and approve/reject it via their dashboard.
- **Technical Decisions**: Stock decrement logic has been separated from the initial participant registration controller and moved it entirely to the organizer's approval controller to prevent stock race conditions.

**2. QR Scanner & Attendance Tracking**
- **Justification**: Validating tickets manually via ID search is slow. A QR system provides instantaneous validity checks and updates attendance simultaneously.
- **Design Choices & Implementation**: The backend `@qrcode` library encodes the Ticket ID and emails it upon approval. The frontend uses `html5-qrcode` (via `QRScanner.jsx`) to capture the code logic directly from the device camera and securely POSTs the check-in to the `scanTicket` backend validation route which strictly enforces single-use attendance and updates the database.

### Tier B Features

**1. Real-Time Discussion Forum**
- **Justification**: Participants need a streamlined way to ask event-specific questions directly to organizers without writing formal emails. 
- **Design Choices & Implementation**: Implemented using the WebSocket standard (`socket.io`). The backend `server.js` initializes a Socket.io instance to listen for `forum:join` and `forum:leave` events, allocating isolated channels/rooms dynamically based on the Event ID so users only receive broadcasted messages for their current event.

**2. Organizer Password Reset Workflow**
- **Justification**: Gives organizers a secure medium to regain access to their accounts while maintaining administrative control.
- **Design Choices & Implementation**: Organizers submit a reset request. Admin can view a queue of requests, approve them, or reject them with specific comments. 
- **Technical Decisions**: Nodemailer dynamically sends status updates depending on the admin's action inside `adminController.js`. Admin comments on rejections are permanently logged into a history array so the organizer can view transparent reasons for denial.

### Additional Implementations

**1. Event Analytics Dashboard (Organizer Feature)**
- **Design Choices & Implementation**: The `getEventAnalytics` controller fetches and filters all registrations for an event. It dynamically calculates attendance rates by comparing `attendedCount` with `totalRegistrations`, and computes total revenue by multiplying accepted registrations with the `regFee`. This data is cleanly rendered on the Organizer Dashboard.
- **Technical Decisions**: Instead of storing derived aggregate arrays in the `Events` collection, analytics are computed dynamically on-the-fly referencing the single-source-of-truth `Registration` documents to ensure data consistency.

**2. Fuzzy Search & Filtering (Participant Feature)**
- **Design Choices & Implementation**: The Browse Events page integrates `fuse.js` on the frontend client side. It takes the full array of active events and allows the participant to execute partial and typo-tolerant fuzzy searches against `event.name` and `event.organizerName`.
- **Technical Decisions**: Filtering and fuzzy search were entirely offloaded to the client-side React frontend rather than querying the database repeatedly. This drastically reduces MongoDB read operations during rapid user typing.

### Tier C Features

**1. Add to Calendar Integration (.ics, Google, Outlook)**
- **Justification**: Improves event attendance and UX by letting users optionally sync the event dates to Apple Calendar, Outlook, or Google Calendar directly from their dashboard.
- **Design Choices & Implementation**: 
  - **.ics Download**: Utilizing a custom `calendarService.js` wrapper around the `ics` library, a backend endpoint formats the event's start time, end time, description, and title into a strict array-based date format to generate a downloadable `.ics` blob.
  - **Google & Outlook Calendar**: The frontend natively constructs Google and Outlook calendar event deep-links dynamically using JavaScript template literals and `toISOString()` parsing for one-click web browser integrations without needing an API key.
