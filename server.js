const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuration
const PORT = process.env.PORT || 3000;
const CHAT_PASSWORD = process.env.CHAT_PASSWORD || 'chatpassword123';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = function (req, file, cb) {
    // Only allow image files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));
app.use(express.json());

// Store connected users
const users = new Map();

// API endpoint to verify password
app.post('/api/verify-password', (req, res) => {
    const { password } = req.body;
    if (password === CHAT_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// API endpoint to upload images
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl: imageUrl });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user joining
    socket.on('join', (data) => {
        const { username, password } = data;
        
        // Verify password
        if (password !== CHAT_PASSWORD) {
            socket.emit('error', { message: 'Invalid password' });
            return;
        }

        // Check if username is already taken
        for (const [id, user] of users) {
            if (user.username === username) {
                socket.emit('error', { message: 'Username already taken' });
                return;
            }
        }

        // Store user
        users.set(socket.id, { username, joinedAt: new Date() });
        
        // Notify the user they joined successfully
        socket.emit('joined', { username });
        
        // Notify others
        socket.broadcast.emit('user-joined', { username });
        
        // Send current user list
        const userList = Array.from(users.values()).map(u => u.username);
        io.emit('user-list', { users: userList });
        
        console.log(`${username} joined the chat`);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        const user = users.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'You must join the chat first' });
            return;
        }

        const messageData = {
            username: user.username,
            message: data.message,
            timestamp: new Date().toISOString()
        };

        io.emit('chat-message', messageData);
    });

    // Handle image messages
    socket.on('image-message', (data) => {
        const user = users.get(socket.id);
        if (!user) {
            socket.emit('error', { message: 'You must join the chat first' });
            return;
        }

        const messageData = {
            username: user.username,
            imageUrl: data.imageUrl,
            timestamp: new Date().toISOString()
        };

        io.emit('image-message', messageData);
    });

    // Handle typing indicator
    socket.on('typing', () => {
        const user = users.get(socket.id);
        if (user) {
            socket.broadcast.emit('user-typing', { username: user.username });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            users.delete(socket.id);
            io.emit('user-left', { username: user.username });
            
            // Update user list
            const userList = Array.from(users.values()).map(u => u.username);
            io.emit('user-list', { users: userList });
            
            console.log(`${user.username} left the chat`);
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
    console.log(`Chat password: ${CHAT_PASSWORD}`);
});
