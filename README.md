# 💬 Just Friend Chat App

Just Friend Chat App is a modern, real-time private messaging app built with the MERN stack and Socket.io. It features auto-login, infinite scrolling, friend management, typing indicators, and more — all optimized for performance with lazy imports and deployed on Render.

---

## 🧠 Key Features

- 🔐 **JWT Authentication** – Auto-login and logout based on token validity
- 💬 **Real-time Chat** – Uses Socket.io for live, instant messaging
- 👁️ **Message Seen Indicator** – Displays when messages are read
- ⌨️ **Typing Indicator** – Shows when the user is typing
- 🔄 **Infinite Scroll** – Loads 20 messages at a time while scrolling
- 🔍 **Search & Add Friends** – Search users by name and add them to your chat list
- 🔑 **Password Reset** – Reset password securely using Nodemailer
- ❌ **Friend Management** – Option to unfriend users anytime
- 📱 **Responsive UI** – Fully works on both desktop and mobile screens
- 🔁 **Auto-Relogin** – Automatically logs in if JWT token is still valid
- 🧹 **Auto-Deleting Seen Messages** – Automatically deletes seen messages 24 hours after being viewed using a scheduled **Cron Job**
- ⚡ **Lazy Import in React** – Only loads required components to improve performance and reduce initial load time
- 🌍 **Hosted on Render** – Live deployment on Render cloud platform

---

## 🛠️ Technologies Used

- 🎨 **Frontend** – React.js, CSS (with Lazy Imports)
- ⚙️ **Backend** – Node.js, Express.js
- 🔌 **Real-Time Engine** – Socket.io
- 🧠 **Database** – MongoDB with Mongoose
- 🔐 **Authentication** – JWT (JSON Web Tokens)
- ✉️ **Mail Service** – Notemail (Nodemailer)
- ⏱️ **Scheduler** – Node Cron Job for deleting messages
- ☁️ **Hosting** – Render.com

---

## 🌐 System Workflow

### 🔐 Authentication Flow
1. App loads the `LoadingPage`
2. Checks for stored JWT token in localStorage
3. If token is valid → auto-login and connect to Socket.io
4. If token is missing or invalid → redirect to `LoginPage`

### 👤 Login & Account Flow
- Login with username and password
- Create a new account via `CreateUsernamePage`
- Reset password via email using Nodemailer
- Encrypted JWT is stored in browser localStorage after login

### 💬 Chat & Friends Workflow
1. Navigate to `HomePage`
2. Use search bar to find friends (real-time suggestions)
3. Click a user to add to friend list
4. Click a friend → go to `ChatPage`
5. Loads 20 latest messages initially
6. Scroll up → loads next 20 messages dynamically
7. Real-time typing, seen indicators, and message delivery
8. If the receiver is offline, messages are stored in MongoDB temporarily
9. Option to **Unfriend** from the friend list
10. Seen messages are scheduled for deletion 24 hours after being read (via Cron Job)

---

## 📘 Note
This project was created for **educational and learning purposes only**. Not intended for commercial or production use.

---
