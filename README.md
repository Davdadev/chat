# Chat Room

A real-time, password-protected online chat application where multiple users can create usernames, join the chat, send messages, and share images.

## Features

- **Password Protection**: The entire chat is protected by a password
- **Username System**: Users can create unique usernames to join the chat
- **Real-time Messaging**: Instant message delivery using WebSockets (Socket.io)
- **Image Sharing**: Upload and share images in the chat (up to 5MB, supports JPEG, PNG, GIF, WebP)
- **Online Users List**: See who's currently in the chat
- **Typing Indicators**: See when others are typing
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the chat password (optional):
   ```bash
   cp .env.example .env
   # Edit .env and set your CHAT_PASSWORD
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Configuration

Create a `.env` file in the root directory with the following options:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `CHAT_PASSWORD` | Password to access the chat | `chatpassword123` |

## Usage

1. Open the chat URL in your browser
2. Enter your desired username
3. Enter the chat password
4. Click "Join Chat"
5. Start chatting and sharing images!

## Deployment

To deploy this application:

1. Set the `CHAT_PASSWORD` environment variable to a secure password
2. Set the `PORT` environment variable if needed
3. Run `npm start`

The application can be deployed to any Node.js hosting platform like:
- Heroku
- Railway
- Render
- DigitalOcean App Platform
- AWS, GCP, or Azure

## Tech Stack

- **Backend**: Node.js, Express.js
- **Real-time Communication**: Socket.io
- **File Upload**: Multer
- **Frontend**: Vanilla HTML, CSS, JavaScript

## License

ISC