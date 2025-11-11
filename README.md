# Framez - Social Media App 📱

A modern, full-featured social media application built with React Native, Expo, Convex, and Firebase. Framez allows users to share posts, connect with others, and showcase their work in a clean, intuitive interface.

## 🎯 Project Overview

**Framez** is a mobile social application that enables users to share posts with text and images. Each user has a personalized profile to view their posts and activity. Built as part of the Hannel Frontend Stage 4 Task, this app demonstrates advanced React Native development with real-time data, authentication, and polished UI/UX.

### 📋 Core Objectives
- ✅ Implement user authentication (sign-up, login, logout) using Convex with custom auth
- ✅ Allow users to create posts with text and images
- ✅ Display a feed of posts from all users in chronological order
- ✅ Display current user's profile with their posts and activity
- ✅ Persistent user sessions across app restarts

## 🚀 Features

### 🔐 Authentication
- Secure login, registration, and logout flow
- Persistent user sessions (remain logged in after reopening the app)
- Custom authentication context integrated with Convex backend
- Protected routes and automatic redirects

### 📝 Posts
- Create and upload posts containing text and/or multiple images
- Display all posts in chronological feed (most-recent-first)
- Each post displays:
  - Author's name and avatar
  - Post timestamp
  - Content and images
  - Like and comment counts
- Multiple image support (up to 5 images per post)
- Hashtag extraction and tagging system

### 👤 Profile
- Complete user profile management
- Display user information (name, email, avatar, bio, profession)
- Show all posts created by the current user
- Customizable user expertise and tags
- Project showcase portfolio

### 🔍 Advanced Features
- Real-time search across users, posts, and projects
- Search history persistence
- Image optimization and compression
- Smooth navigation with Expo Router
- Responsive design for both iOS and Android

## 🛠 Tech Stack

### Frontend
- **React Native** with Expo for cross-platform development
- **TypeScript** for type-safe code
- **Expo Router** for file-based navigation
- **React Context** for state management
- **Expo Image Picker** for image selection

### Backend & Services
- **Convex** (Primary Backend)
  - Real-time database
  - Authentication integration
  - Search functionality
  - User and project management
- **Firebase** (Posts & Storage)
  - Firestore for post data
  - Storage for image uploads
  - Reliable file management

### Storage & Database
- **Convex Database**: Users, projects, search history, comments, likes
- **Firebase Firestore**: Posts collection
- **Firebase Storage**: Image files and media
- **AsyncStorage**: Local session persistence

### Authentication
- **Custom Auth Context** with Convex integration
- Session persistence with AsyncStorage
- Protected route management

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- iOS Simulator (Xcode) or Android Studio
- Convex account
- Firebase account

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/framez-app.git
cd framez-app