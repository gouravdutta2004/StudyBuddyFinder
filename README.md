# Study Buddy Finder 🚀

> The ultimate collaborative learning platform designed to connect students, form high-performance study squads, and supercharge academic productivity.

![React](https://img.shields.io/badge/React-18.x-blue?logo=react&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5.x-purple?logo=vite&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=nodedotjs&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-darkgreen?logo=mongodb&style=flat-square)
![Socket.io](https://img.shields.io/badge/Socket.io-Socket-black?logo=socketdotio&style=flat-square)

Study Buddy Finder is a modern, full-stack SaaS application built on the MERN stack. It features a stunning, glassmorphic UI powered by **Framer Motion**, and a robust backend that handles real-time WebSockets, dynamic activity heatmaps, and secure Google OAuth integration.

---

## ✨ Key Features

### 👤 User Experience
*   **Intelligent Matching:** Find study partners based on university, subjects, and study style (e.g., Pomodoro, Deep Work).
*   **Real-Time Squad Hubs:** Dedicated group pages complete with:
    *   **Live Chat:** Real-time messaging using Socket.io.
    *   **AI Tutor:** Built-in `@Gemini` chat integration for instant academic assistance.
    *   **Kanban Board:** Drag-and-drop task management synchronized across the squad.
    *   **Squad Vault:** Upload, share, and manage study materials and resource links.
*   **Velocity Heatmap:** A GitHub-style daily activity tracker that dynamically logs your study sessions and interactions.
*   **Premium UI/UX:** Deep dark mode (`slate-950`), custom SVG cursors, floating bento grids, and fluid scroll animations.
*   **Google OAuth:** Seamless one-tap login and registration.

### 🛡️ Admin Super-Panel
*   **Complete CMS:** Dynamically update landing page copy, FAQs, and global site configurations in real-time.
*   **User Management:** Full CRUD operations on users, including blocking/unblocking and monitoring user statistics.
*   **Global Activity Feed:** A real-time data hose showing all platform interactions socketed directly to the admin dashboard.
*   **Broadcast Engine:** Send global announcements and sticky banners to all active users instantly.

---

## 🛠 Tech Stack

**Frontend (`/fe`)**
*   **Framework:** React 18, Vite
*   **Styling:** Material-UI (MUI), TailwindCSS, Emotion
*   **Animation:** Framer Motion, React Lenis (Smooth Scroll)
*   **State & Routing:** React Router v6, Context API
*   **Auth:** `@react-oauth/google`

**Backend (`/be`)**
*   **Core:** Node.js, Express.js
*   **Database:** MongoDB, Mongoose
*   **Real-Time:** Socket.io
*   **Auth:** JWT (JSON Web Tokens), `google-auth-library`, bcryptjs
*   **File Handling:** Multer

---

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or Atlas URI)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/gouravdutta2004/StudyBuddyFinder.git
cd StudyBuddyFinder
\`\`\`

### 2. Environment Variables

Create exactly two `.env` files. One inside `/be` and one inside `/fe`.

**Backend (`be/.env`)**
\`\`\`env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_cloud_oauth_client_id
FRONTEND_URL=http://localhost:5173
\`\`\`

**Frontend (`fe/.env`)**
\`\`\`env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_cloud_oauth_client_id
\`\`\`

### 3. Installation

Install dependencies for both the frontend and backend concurrently:
\`\`\`bash
# Install backend dependencies
cd be
npm install

# Install frontend dependencies
cd ../fe
npm install --legacy-peer-deps
\`\`\`

### 4. Running the Development Servers

Open two separate terminal windows.

**Terminal 1: Start the Backend (Port 5001)**
\`\`\`bash
cd be
npm run dev
\`\`\`

**Terminal 2: Start the Frontend (Port 5173)**
\`\`\`bash
cd fe
npm run dev
\`\`\`

Navigate to `http://localhost:5173` in your browser to see the application!

---

## 🗂 Project Structure

\`\`\`text
StudyBuddyFinder/
├── be/                       # Node.js / Express Backend
│   ├── src/
│   │   ├── controllers/      # Route logic (Auth, Users, Groups, Admin)
│   │   ├── middleware/       # JWT Auth protection
│   │   ├── models/           # Mongoose Schemas (User, Task, ActivityLog)
│   │   ├── routes/           # Express API endpoints
│   │   └── utils/            # Helper functions (Sockets, Email)
│   └── server.js             # Entry point & Initializer
│
├── fe/                       # React / Vite Frontend
│   ├── src/
│   │   ├── api/              # Axios interceptors instance
│   │   ├── components/       # Reusable UI Blocks (Navbar, CustomCursor, Squad)
│   │   ├── context/          # Global State (Auth, Theme, WebSockets)
│   │   ├── pages/            # Next-level page views (Dashboard, Admin, Landing)
│   │   └── App.jsx           # Root layout & Routing tree
│   ├── index.css             # Tailwind Directives
│   └── vite.config.js        # Vite compiler rules
└── README.md                 # Project Documentation
\`\`\`

---

## 📜 License
This project is proprietary and built specifically for the C.V. RAMAN GLOBAL UNIVERSITY ecosystem. All rights reserved.
