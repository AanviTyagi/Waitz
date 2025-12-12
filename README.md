# 🚀 Smart Queue Management System (Waitz)

> A modern, real-time queue management solution designed for educational institutions, featuring live tracking, food ordering, and anti-gravity aesthetics.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)

## 🌟 Overview

**Waitz** (Smart Queue Mgm) streamlines operations for busy campus facilities like Canteens, Libraries, Labs, and Stationary shops. It replaces physical lines with a digital token system, allowing students to queue remotely, order food in advance, and track wait times in real-time.

### ✨ Key Features

*   **⚡ Real-Time Updates**: Instant status changes using Socket.io (no refreshing needed).
*   **🍔 Canteen Pre-Ordering**: 
    *   Browse menus with categories (Snacks, Beverages, etc.).
    *   Multi-item cart system.
    *   **Smart Wait Time**: Calculates pickup time based on queue length + item preparation time.
*   **🌌 Anti-Gravity UI**: 
    *   Stunning login experience with interactive floating physics.
    *   Glassmorphism design language throughout the dashboard.
*   **📊 Admin Dashboard**:
    *   Kanban-style order management (Waiting -> Cooking -> Ready).
    *   Menu management (Toggle availability of items).
*   **👤 Student Dashboard**:
    *   Live "Walking Man" queue progress animation.
    *   Wallet balance tracking.
    *   One-click queue joining.

---

## 🛠️ Technology Stack

*   **Frontend**: React.js (Vite), Tailwind CSS, GSAP (Animations), Framer Motion.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Mongoose Schema).
*   **Real-Time**: Socket.io.
*   **Authentication**: JWT (JSON Web Tokens).

---

## 📂 Directory Structure

```
Smart Queue Mgm/
├── backend/            # Express Server & API
│   ├── models/         # MongoDB Schemas (Queue, Token, Student)
│   ├── routes/         # Auth & API Routes
│   └── server.js       # Entry point & Socket.io setup
│
└── frontend/           # React Client
    ├── src/
    │   ├── components/ # Dashboards, Auth, AntiGravity Background
    │   └── context/    # Toast Notifications
    └── tailwind.config # Styling configuration
```

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v16+)
*   MongoDB (Local or Atlas URI)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Smart Queue Mgm"
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure Environment
# Create a .env file and add your Mongo URI & JWT Secret
echo "MONGO_URI=mongodb://localhost:27017/smartqueue" > .env
echo "JWT_SECRET=your_super_secret_key" >> .env
echo "PORT=5000" >> .env

# Start Server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Start React App
npm run dev
```

The app should now be running at `http://localhost:5173` (Frontend) and `http://localhost:5000` (Backend).

---

## 🔐 Credentials (Default/Seeded)

**Staff/Admin Login**:
*   *Email*: `admin@ikgptu.ac.in`
*   *Password*: `admin123` (Ensure you create this user via Signup first if DB is fresh)

**Student Login**:
*   Use the "Student Signup" tab to create a test account.

---

## 🖼️ Gallery

*   **Anti-Gravity Login**: Interactive particle background.
*   **Live Queue**: Watch the animated character walk as your turn approaches.
*   **Food Cart**: Add samosas and chai, see exactly when they'll be ready!

---

## 🤝 Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

*Built with ❤️ for efficient campus life.*
