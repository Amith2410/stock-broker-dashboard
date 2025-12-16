const socket = io();

const STOCKS = [
    'GOOG','TSLA','AMZN','META',
    'NVDA','AAPL','MSFT','NFLX'
];

let subs = new Set();
let prices = {};
let lastPrices = {};
let selectedStock = null;

// ===== AUTH =====
const user = localStorage.getItem('user');
if (!user) location.href = 'index.html';
document.getElementById('user').innerText = `👤 ${user}`;

// ===== DOM =====
const stocksDiv = document.getElementById('stocks');
const subscribedList = document.getElementById('subscribed');
const chartCanvas = document.getElementById('stockChart');

// ===== CHART =====
const stockChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Stock Price',
            data: [],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.1)',
            tension: 0.3
        }]
    },
    options: {
        animation: false,
        responsive: true,
        scales: { y: { beginAtZero: false } }
    }
});

// ===== CREATE BUTTONS =====
STOCKS.forEach(stock => {
    const btn = document.createElement('button');
    btn.innerText = stock;

    btn.onclick = () => {
        subs.add(stock);
        selectedStock = stock;

        // highlight active
        document.querySelectorAll('#stocks button')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // reset chart
        stockChart.data.labels = [];
        stockChart.data.datasets[0].data = [];
        stockChart.data.datasets[0].label = stock;
        stockChart.update();

        render();
    };

    stocksDiv.appendChild(btn);
});

// ===== SOCKET UPDATES =====
socket.on('priceUpdate', data => {
    prices = data.prices;
    lastPrices = data.lastPrices;

    if (selectedStock && prices[selectedStock]) {
        stockChart.data.labels.push(
            new Date().toLocaleTimeString()
        );
        stockChart.data.datasets[0].data.push(
            prices[selectedStock]
        );

        if (stockChart.data.labels.length > 15) {
            stockChart.data.labels.shift();
            stockChart.data.datasets[0].data.shift();
        }
        stockChart.update();
    }

    render();
});

// ===== RENDER SUBSCRIPTIONS =====
function render() {
    subscribedList.innerHTML = '';

    subs.forEach(stock => {
        const price = prices[stock];
        const last = lastPrices[stock];

        let cls = '';
        if (price !== undefined && last !== undefined) {
            cls = price > last ? 'up' : price < last ? 'down' : '';
        }

        const li = document.createElement('li');
        li.className = cls;

        li.innerHTML = `
            <span>
              ${stock}: ${price ? '$' + price : 'Loading...'}
            </span>
            <button>Unsubscribe</button>
        `;

        li.querySelector('button').onclick = () => {
            subs.delete(stock);
            if (selectedStock === stock) selectedStock = null;
            render();
        };

        subscribedList.appendChild(li);
    });
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('user');
    location.href = 'index.html';
}

// ===== THEME =====
function toggleTheme() {
    document.body.classList.toggle('dark');
}
