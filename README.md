# Options Strategy Visualizer

A premium, interactive tool to visualize options strategies with real-time price updates from Yahoo Finance.

## Features
- **Asset Agnostic**: Works with any Yahoo Finance ticker (e.g., `SPY`, `^GDAXI`, `BTC-USD`).
- **Payoff Visualization**: Interactive Chart.js graph showing Profit & Loss at expiration.
- **Smart Ledger**: Automated calculation of Realized vs. Open P&L based on a movement history (FIFO/Offsetting side match).
- **URL Sharing**: Share your entire portfolio/strategy with a single Base64-encoded link.
- **Dark Mode Aesthetic**: Modern, premium UI built with vanilla HTML/CSS/JS.

## How to Use
1. **Add Movements**: Use the "Aggiungi Movimento" button to log your trades (Type, Side, Strike, Premium, Expiry, Qty).
2. **Configure Asset**: Click the gear icon ⚙️ to change the ticker and multiplier (e.g., 100 for US Options, 10 for STOXX50).
3. **Share**: Click the link icon 🔗 to copy a shareable URL to your clipboard.

## Technical Notes
- **Local Storage**: All data is saved locally in your browser.
- **CORS Proxy**: Uses `allorigins.win` to fetch real-time data from Yahoo Finance without a backend.
- **Standalone**: No dependencies other than Chart.js (loaded via CDN).

## Deployment
This project is ready for **GitHub Pages**. Simply upload the files to a repository and enable Pages in the settings.

---

# Visualizzatore Strategie Opzioni (Italiano)

Uno strumento premium per visualizzare strategie in opzioni con prezzi in tempo reale.

## Caratteristiche
- **Agnostico**: Funziona con qualsiasi ticker di Yahoo Finance.
- **Visualizzazione Payoff**: Grafico interattivo del Profit & Loss a scadenza.
- **Registro Intelligente**: Calcolo automatico del P&L Realizzato.
- **Condivisione URL**: Condividi la tua strategia con un semplice link.

## Installazione
Non serve installazione. Apri il file `index.html` nel tuo browser o caricalo su GitHub Pages.
