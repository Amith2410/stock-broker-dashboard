const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.static('public'));

// ===== FILE PATH =====
const USERS_FILE = path.join(__dirname, 'users.json');

// ===== STOCK SETUP =====
const STOCKS = [
    'GOOG', 'TSLA', 'AMZN', 'META',
    'NVDA', 'AAPL', 'MSFT', 'NFLX'
];

let prices = {};
let lastPrices = {};

// Initialize prices
STOCKS.forEach(stock => {
    const base = Math.floor(Math.random() * 500) + 200;
    prices[stock] = base;
    lastPrices[stock] = base;
});

// ===== USER STORAGE FUNCTIONS =====
function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({}));
    }

    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return data && data.trim() !== '' ? JSON.parse(data) : {};
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ===== AUTH ROUTES =====
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password required' });
    }

    const users = loadUsers();

    if (users[email]) {
        return res.status(400).json({ msg: 'User already exists' });
    }

    users[email] = { password };
    saveUsers(users);

    res.json({ msg: 'Registered successfully' });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const users = loadUsers();

    if (!users[email] || users[email].password !== password) {
        return res.status(401).json({ msg: 'Invalid credentials' });
    }

    res.json({ msg: 'Login successful' });
});

// ===== STOCK PRICE UPDATES =====
setInterval(() => {
    STOCKS.forEach(stock => {
        lastPrices[stock] = prices[stock];

        const change = Math.floor(Math.random() * 20 - 10);
        prices[stock] += change;

        if (prices[stock] < 1) prices[stock] = 1;
    });

    io.emit('priceUpdate', {
        prices,
        lastPrices
    });
}, 1000);

// ===== SOCKET.IO =====
io.on('connection', socket => {
    console.log('Client connected:', socket.id);

    socket.emit('priceUpdate', {
        prices,
        lastPrices
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// ===== START SERVER =====
server.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});
