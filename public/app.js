// DOM Elements
const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const currentUserSpan = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const imageInput = document.getElementById('image-input');
const messagesDiv = document.getElementById('messages');
const usersList = document.getElementById('users-list');
const typingIndicator = document.getElementById('typing-indicator');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const closeModal = document.querySelector('.close-modal');

// State
let socket = null;
let currentUsername = '';
let typingTimeout = null;

// Initialize Socket.io connection
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('joined', (data) => {
        currentUsername = data.username;
        showChatScreen();
        addSystemMessage(`Welcome to the chat, ${data.username}!`);
    });

    socket.on('error', (data) => {
        loginError.textContent = data.message;
    });

    socket.on('user-joined', (data) => {
        addSystemMessage(`${data.username} joined the chat`);
    });

    socket.on('user-left', (data) => {
        addSystemMessage(`${data.username} left the chat`);
    });

    socket.on('user-list', (data) => {
        updateUsersList(data.users);
    });

    socket.on('chat-message', (data) => {
        addChatMessage(data);
    });

    socket.on('image-message', (data) => {
        addImageMessage(data);
    });

    socket.on('user-typing', (data) => {
        showTypingIndicator(data.username);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        addSystemMessage('Disconnected from server. Trying to reconnect...');
    });
}

// Screen Management
function showChatScreen() {
    loginScreen.classList.remove('active');
    chatScreen.classList.add('active');
    currentUserSpan.textContent = `Logged in as: ${currentUsername}`;
    messageInput.focus();
}

function showLoginScreen() {
    chatScreen.classList.remove('active');
    loginScreen.classList.add('active');
    loginError.textContent = '';
    usernameInput.value = '';
    passwordInput.value = '';
    messagesDiv.innerHTML = '';
    usersList.innerHTML = '';
}

// Message Functions
function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.innerHTML = `<span>${escapeHtml(text)}</span>`;
    messagesDiv.appendChild(div);
    scrollToBottom();
}

function addChatMessage(data) {
    const isOwnMessage = data.username === currentUsername;
    const div = document.createElement('div');
    div.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(data.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
    clearTypingIndicator();
}

function addImageMessage(data) {
    const isOwnMessage = data.username === currentUsername;
    const div = document.createElement('div');
    div.className = `message ${isOwnMessage ? 'own-message' : ''}`;
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    div.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(data.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">
            <img src="${escapeHtml(data.imageUrl)}" alt="Shared image" class="message-image" onclick="openImageModal('${escapeHtml(data.imageUrl)}')">
        </div>
    `;
    
    messagesDiv.appendChild(div);
    scrollToBottom();
    clearTypingIndicator();
}

function updateUsersList(users) {
    usersList.innerHTML = '';
    users.forEach(username => {
        const li = document.createElement('li');
        li.textContent = username;
        if (username === currentUsername) {
            li.style.fontWeight = '600';
        }
        usersList.appendChild(li);
    });
}

function showTypingIndicator(username) {
    typingIndicator.textContent = `${username} is typing...`;
    
    // Clear after 2 seconds
    setTimeout(() => {
        clearTypingIndicator();
    }, 2000);
}

function clearTypingIndicator() {
    typingIndicator.textContent = '';
}

function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Image Modal
function openImageModal(imageUrl) {
    modalImage.src = imageUrl;
    imageModal.classList.add('active');
}

function closeImageModal() {
    imageModal.classList.remove('active');
    modalImage.src = '';
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if (!username || !password) {
        loginError.textContent = 'Please fill in all fields';
        return;
    }
    
    // Validate username (alphanumeric and basic characters only)
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        loginError.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
        return;
    }
    
    loginError.textContent = '';
    
    // Initialize socket and attempt to join
    if (!socket) {
        initSocket();
    }
    
    // Wait for socket connection then join
    const attemptJoin = () => {
        if (socket.connected) {
            socket.emit('join', { username, password });
        } else {
            setTimeout(attemptJoin, 100);
        }
    };
    
    attemptJoin();
});

logoutBtn.addEventListener('click', () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    currentUsername = '';
    showLoginScreen();
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    socket.emit('chat-message', { message });
    messageInput.value = '';
});

messageInput.addEventListener('input', () => {
    // Emit typing event (throttled)
    if (!typingTimeout) {
        socket.emit('typing');
        typingTimeout = setTimeout(() => {
            typingTimeout = null;
        }, 1000);
    }
});

imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Please select an image file (JPEG, PNG, GIF, or WebP)');
        imageInput.value = '';
        return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        imageInput.value = '';
        return;
    }
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            socket.emit('image-message', { imageUrl: data.imageUrl });
        } else {
            alert('Failed to upload image: ' + data.message);
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload image');
    }
    
    // Reset input
    imageInput.value = '';
});

closeModal.addEventListener('click', closeImageModal);

imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
        closeImageModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && imageModal.classList.contains('active')) {
        closeImageModal();
    }
});

// Make openImageModal globally available
window.openImageModal = openImageModal;
