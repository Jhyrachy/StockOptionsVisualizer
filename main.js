
let myChart = null;

// Settings (persist in localStorage)
let settings = JSON.parse(localStorage.getItem('options_settings')) || {
    ticker: '^STOXX50E',
    multiplier: 10,
    displayName: 'STOXX50',
    expiryDate: ''
};

// Data (persist in localStorage)
let movements = JSON.parse(localStorage.getItem('options_movements')) || [];

// Runtime state
let currentPrice = 0;
let openPositions = [];
let totalRealizedPL = 0;

// DOM Elements
const movementsBody = document.getElementById('movementsBody');
const addMovementBtn = document.getElementById('addMovementBtn');
const movementModal = document.getElementById('movementModal');
const movementForm = document.getElementById('movementForm');
const closeModal = document.getElementById('closeModal');

const assetModal = document.getElementById('assetModal');
const assetForm = document.getElementById('assetForm');
const editAssetBtn = document.getElementById('editAssetBtn');
const closeAssetModal = document.getElementById('closeAssetModal');
const displayTicker = document.getElementById('displayTicker');
const displayExpiry = document.getElementById('displayExpiry');
const refreshPriceBtn = document.getElementById('refreshPriceBtn');
const shareBtn = document.getElementById('shareBtn');

const realizedPLEl = document.getElementById('realizedPL');
const totalBaselinePLEl = document.getElementById('totalBaselinePL');
const livePriceEl = document.getElementById('livePrice');
const priceChangeEl = document.getElementById('priceChange');
const openPositionsList = document.getElementById('openPositionsList');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const importInput = document.getElementById('importInput');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    handleUrlState();
    loadSettings();
    processLedger();
    updateUI();
    initChart();
    fetchLivePrice();
    setInterval(fetchLivePrice, 300000);
});

function handleUrlState() {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    if (state) {
        try {
            const decoded = JSON.parse(atob(state));
            if (confirm("Hai aperto un link condiviso. Vuoi importare i dati? (Questo sovrascriverà i tuoi dati locali)")) {
                settings = decoded.settings || settings;
                movements = decoded.movements || movements;
                saveData();
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.error("Errore decodifica stato URL", e);
        }
    }
}

function loadSettings() {
    displayTicker.innerText = settings.displayName || settings.ticker;
    document.getElementById('expiryDate').value = settings.expiryDate || '';
    updateExpiryDisplay();
}

function updateExpiryDisplay() {
    if (displayExpiry) {
        displayExpiry.innerText = settings.expiryDate ? `Scadenza: ${settings.expiryDate}` : '';
    }
}

function saveData() {
    localStorage.setItem('options_settings', JSON.stringify(settings));
    localStorage.setItem('options_movements', JSON.stringify(movements));
}

let realizedPnLMap = {};

function processLedger() {
    totalRealizedPL = 0;
    realizedPnLMap = {};
    const inventory = {};

    // Sort movements by date
    movements.sort((a, b) => new Date(a.date) - new Date(b.date));

    movements.forEach(m => {
        const key = `${m.type}-${m.strike}`;
        if (!inventory[key]) inventory[key] = [];

        let remainingQty = m.quantity;
        let movementRealized = 0;

        // Try to offset against existing positions (FIFO)
        while (remainingQty > 0 && inventory[key].length > 0 && inventory[key][0].side !== m.side) {
            const match = inventory[key][0];
            const matchQty = Math.min(remainingQty, match.quantity);

            const sellPremium = m.side === 'SELL' ? m.premium : match.premium;
            const buyPremium = m.side === 'BUY' ? m.premium : match.premium;

            const pnl = (sellPremium - buyPremium) * matchQty * settings.multiplier;
            totalRealizedPL += pnl;
            movementRealized += pnl;

            remainingQty -= matchQty;
            match.quantity -= matchQty;

            if (match.quantity === 0) inventory[key].shift();
        }

        if (movementRealized !== 0) {
            realizedPnLMap[m.id] = movementRealized;
        }

        if (remainingQty > 0) {
            inventory[key].push({
                side: m.side,
                premium: m.premium,
                quantity: remainingQty,
                originalId: m.id
            });
        }
    });

    openPositions = [];
    for (const key in inventory) {
        inventory[key].forEach(item => {
            const [type, strike] = key.split('-');
            openPositions.push({
                type,
                strike: parseFloat(strike),
                side: item.side,
                premium: item.premium,
                quantity: item.quantity,
                originalId: item.originalId
            });
        });
    }
}

async function fetchLivePrice() {
    if (!refreshPriceBtn) return;
    refreshPriceBtn.classList.add('spinning');
    try {
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const targetUrl = encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${settings.ticker}`);

        const response = await fetch(proxyUrl + targetUrl);
        const data = await response.json();
        const result = JSON.parse(data.contents).chart.result[0];

        currentPrice = result.meta.regularMarketPrice;
        const prevClose = result.meta.previousClose;
        const change = currentPrice - prevClose;
        const changePercent = (change / prevClose) * 100;

        livePriceEl.innerText = currentPrice.toFixed(2);
        priceChangeEl.innerText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
        priceChangeEl.className = `price-change ${change >= 0 ? 'price-up' : 'price-down'}`;

        updateChart();
    } catch (error) {
        console.error('Fetch error:', error);
        livePriceEl.innerText = 'N/D';
    } finally {
        refreshPriceBtn.classList.remove('spinning');
    }
}

function updateUI() {
    renderMovements();
    renderOpenPositions();
    updateExpiryDisplay();

    realizedPLEl.innerText = `${totalRealizedPL.toFixed(2)} €`;
    const totalBaseline = totalRealizedPL;
    totalBaselinePLEl.innerText = `${totalBaseline.toFixed(2)} €`;

    updateChart();
}

function renderMovements() {
    movementsBody.innerHTML = '';
    movements.forEach(m => {
        const pnl = realizedPnLMap[m.id] || 0;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${m.date}</td>
            <td>${m.type} ${m.strike}</td>
            <td class="${m.side === 'BUY' ? 'side-buy' : 'side-sell'}">${m.side === 'BUY' ? 'BUY' : 'SELL'}</td>
            <td>${m.premium}</td>
            <td>${m.quantity}</td>
            <td class="${pnl > 0 ? 'pnl-positive' : (pnl < 0 ? 'pnl-negative' : '')}">
                ${pnl !== 0 ? pnl.toFixed(2) + ' €' : '-'}
            </td>
            <td><button class="btn-delete" onclick="deleteMovement(${m.id})">Elimina</button></td>
        `;
        movementsBody.appendChild(row);
    });
}

function renderOpenPositions() {
    openPositionsList.innerHTML = '';
    if (openPositions.length === 0) {
        openPositionsList.innerHTML = '<p style="color: var(--text-secondary)">Nessuna posizione aperta.</p>';
        return;
    }
    openPositions.forEach(pos => {
        const badge = document.createElement('div');
        badge.className = 'open-pos-badge';
        badge.innerHTML = `
            <div class="type-strike">${pos.type} ${pos.strike}</div>
            <div class="side-qty ${pos.side === 'BUY' ? 'side-buy' : 'side-sell'}">
                ${pos.side === 'BUY' ? 'LONG' : 'SHORT'} - Q.tà: ${pos.quantity}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary)">Scadenza Strategia: ${settings.expiryDate || 'N/D'}</div>
        `;
        openPositionsList.appendChild(badge);
    });
}

window.deleteMovement = (id) => {
    movements = movements.filter(m => m.id !== id);
    processLedger();
    saveData();
    updateUI();
};

// UI Handlers
addMovementBtn.onclick = () => {
    document.getElementById('movementDate').value = new Date().toISOString().split('T')[0];
    movementModal.style.display = 'flex';
};
closeModal.onclick = () => movementModal.style.display = 'none';

editAssetBtn.onclick = () => {
    document.getElementById('tickerInput').value = settings.ticker;
    document.getElementById('multiplierInput').value = settings.multiplier;
    document.getElementById('expiryDate').value = settings.expiryDate || '';
    assetModal.style.display = 'flex';
};
closeAssetModal.onclick = () => assetModal.style.display = 'none';

refreshPriceBtn.onclick = () => fetchLivePrice();

shareBtn.onclick = () => {
    const state = {
        settings: settings,
        movements: movements
    };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}?state=${encoded}`;

    navigator.clipboard.writeText(url).then(() => {
        alert("Link di condivisione copiato negli appunti!");
    }).catch(err => {
        console.error("Errore copia link", err);
        prompt("Copia il link qui sotto:", url);
    });
};

exportJsonBtn.onclick = () => {
    const data = {
        settings: settings,
        movements: movements,
        version: "1.0",
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategia_opzioni_${settings.displayName || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

importJsonBtn.onclick = () => importInput.click();

importInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm("Vuoi importare i dati dal file? (Questo sovrascriverà i tuoi dati locali)")) {
                settings = data.settings || settings;
                movements = data.movements || movements;
                saveData();
                loadSettings();
                processLedger();
                updateUI();
                fetchLivePrice();
                alert("Importazione completata!");
            }
        } catch (err) {
            alert("Errore nell'importazione: file non valido.");
        }
    };
    reader.readAsText(file);
};

movementForm.onsubmit = (e) => {
    e.preventDefault();
    const newMovement = {
        id: Date.now(),
        date: document.getElementById('movementDate').value,
        type: document.getElementById('type').value,
        strike: parseFloat(document.getElementById('strike').value),
        side: document.getElementById('side').value,
        premium: parseFloat(document.getElementById('premium').value),
        quantity: parseInt(document.getElementById('quantity').value)
    };
    movements.push(newMovement);
    movementModal.style.display = 'none';
    movementForm.reset();
    processLedger();
    saveData();
    updateUI();
};

assetForm.onsubmit = (e) => {
    e.preventDefault();
    const newTicker = document.getElementById('tickerInput').value.trim().toUpperCase();
    settings.ticker = newTicker;
    settings.multiplier = parseInt(document.getElementById('multiplierInput').value);
    settings.expiryDate = document.getElementById('expiryDate').value;

    settings.displayName = newTicker.startsWith('^') ? newTicker.substring(1) : newTicker;

    displayTicker.innerText = settings.displayName;
    assetModal.style.display = 'none';

    processLedger();
    saveData();
    updateUI();
    fetchLivePrice();
};

function calculatePnL(price, pos) {
    let pnl = 0;
    if (pos.type === 'CALL') {
        const intrinsicValue = Math.max(price - pos.strike, 0);
        pnl = pos.side === 'BUY' ? (intrinsicValue - pos.premium) : (pos.premium - intrinsicValue);
    } else {
        const intrinsicValue = Math.max(pos.strike - price, 0);
        pnl = pos.side === 'BUY' ? (intrinsicValue - pos.premium) : (pos.premium - intrinsicValue);
    }
    return pnl * pos.quantity * settings.multiplier;
}

function initChart() {
    const ctx = document.getElementById('plChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Profit / Loss (€)',
                data: [],
                borderWidth: 3,
                fill: { target: 'origin', above: 'rgba(63, 185, 80, 0.1)', below: 'rgba(248, 81, 73, 0.1)' },
                tension: 0.1,
                pointRadius: 0,
                segment: {
                    borderColor: ctx => {
                        const p0 = ctx.p0.parsed.y;
                        const p1 = ctx.p1.parsed.y;
                        return p0 >= 0 && p1 >= 0 ? '#3fb950' : (p0 <= 0 && p1 <= 0 ? '#f85149' : '#bc8cff');
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    grid: { color: 'rgba(48, 54, 61, 0.2)' },
                    ticks: { color: '#8b949e' }
                },
                y: {
                    grid: {
                        color: (c) => c.tick.value === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(48, 54, 61, 0.2)',
                        lineWidth: (c) => c.tick.value === 0 ? 2 : 1
                    },
                    ticks: { color: '#8b949e' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (c) => `P/L: ${c.parsed.y.toFixed(2)} €`
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!myChart) return;

    const baseline = totalRealizedPL;

    let minS = 0, maxS = 0;
    if (openPositions.length > 0 || currentPrice > 0) {
        const values = openPositions.map(p => p.strike);
        if (currentPrice > 0) values.push(currentPrice);
        minS = Math.min(...values) - 300;
        maxS = Math.max(...values) + 300;
        if (minS < 0) minS = 0;
    } else {
        minS = 5000; maxS = 6000;
    }

    const dataPoints = [];
    const step = (maxS - minS) / 200; // More precision
    const breakEvens = [];

    let prevY = null;
    let prevX = null;

    for (let p = minS; p <= maxS; p += step) {
        let pnl = baseline;
        openPositions.forEach(pos => {
            pnl += calculatePnL(p, pos);
        });
        dataPoints.push({ x: p, y: pnl });

        if (prevY !== null && ((prevY < 0 && pnl >= 0) || (prevY > 0 && pnl <= 0))) {
            // Linear interpolation for more precise breakeven
            const ratio = Math.abs(prevY) / (Math.abs(prevY) + Math.abs(pnl));
            const beX = prevX + (p - prevX) * ratio;
            breakEvens.push(beX);
        }
        prevY = pnl;
        prevX = p;
    }

    myChart.data.datasets[0].data = dataPoints;

    const breakEvenPlugin = {
        id: 'breakEvenMarkers',
        afterDraw: (chart) => {
            const { ctx, scales: { x, y } } = chart;
            ctx.save();
            breakEvens.forEach(be => {
                const xPos = x.getPixelForValue(be);
                const yPos = y.getPixelForValue(0);
                if (xPos >= chart.chartArea.left && xPos <= chart.chartArea.right) {
                    ctx.beginPath();
                    ctx.arc(xPos, yPos, 4, 0, 2 * Math.PI);
                    ctx.fillStyle = '#bc8cff';
                    ctx.fill();

                    ctx.font = '10px Inter';
                    ctx.textAlign = 'center';
                    ctx.fillText(be.toFixed(0), xPos, yPos - 10);
                }
            });
            ctx.restore();
        }
    };

    const currentPricePlugin = {
        id: 'currentPriceLine',
        afterDraw: (chart) => {
            if (currentPrice > 0) {
                const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
                const xPos = x.getPixelForValue(currentPrice);
                if (xPos >= chart.chartArea.left && xPos <= chart.chartArea.right) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#58a6ff';
                    ctx.moveTo(xPos, top);
                    ctx.lineTo(xPos, bottom);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    };

    myChart.config.plugins = [currentPricePlugin, breakEvenPlugin];
    myChart.update();
}
