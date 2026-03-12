# Options Strategy Visualizer

A premium, interactive web tool to visualize options strategies with real-time, resilient price updates from Yahoo Finance.

## Features
- **Asset Agnostic**: Works with any Yahoo Finance ticker (e.g., `SPY`, `^GDAXI`, `BTC-USD`).
- **Payoff Visualization**: Interactive Chart.js graph showing Profit & Loss at expiration with a dynamic, highly visible current price line and breakeven indicators.
- **Smart Ledger**: Automated calculation of Realized vs. Open P&L based on a movement history (FIFO/Offsetting side match).
- **Movement Management**: Add, edit, and delete options trading movements with precision. Includes manual date entry.
- **Data Portability**: 
  - **URL Sharing**: Share your entire portfolio/strategy with a single Base64-encoded link.
  - **JSON Export/Import**: Download your exact ledger and configuration as a `.json` file for local backup, and import it anytime.
- **Resilient Price Fetching**: 
  - Automatically fetches real-time prices using CORS proxies.
  - Features an intelligent 5-minute **caching** system to prevent rate limitations.
  - Incorporates automatic **proxy fallbacks** if the primary server fails.
  - Includes a **Manual Price Fallback** popup if the network is completely down, allowing users to enter quotes directly from Yahoo Finance.
- **Dark Mode Aesthetic**: Modern, premium UI built with vanilla HTML/CSS/JS.

## How to Use
1. **Configure Asset**: Click the gear icon ⚙️ to change the ticker, expiry date, and multiplier (e.g., 100 for US Options, 10 for STOXX50).
2. **Manage Movements**: Use the "Aggiungi Movimento" button to log your trades. Use the "Modifica" or "Elimina" buttons in the ledger to adjust past entries.
3. **Data & Sharing**: Use the right-side icons to Export 📄, Import 📥, or Share 🔗 your current configuration.

## Technical Notes
- **Local Storage**: All data, including the 5-minute price cache, is saved locally in your browser.
- **Standalone**: No backend required. Uses Chart.js (loaded via CDN) and public APIs for data.

## Deployment
This project is ready for **GitHub Pages**. Simply upload the files to a repository and enable Pages in the settings.

---

# Visualizzatore Strategie Opzioni (Italiano)

Uno strumento premium per visualizzare strategie in opzioni con prezzi in tempo reale, estremamente resiliente alle limitazioni di rete.

## Caratteristiche
- **Agnostico**: Funziona con qualsiasi ticker di Yahoo Finance.
- **Visualizzazione Payoff**: Grafico interattivo del Profit & Loss a scadenza, con indicatore dinamico del prezzo attuale e punti di pareggio (breakeven).
- **Gestione Movimenti**: Aggiungi, modifica o elimina i movimenti nel tempo indicando anche la data esatta.
- **Registro Intelligente**: Calcolo automatico del P&L Realizzato e dei margini tramite abbinamento FIFO.
- **Portabilità Dati**:
  - **Condivisione URL**: Condividi la tua strategia con un semplice link.
  - **Export/Import JSON**: Salva e ripristina i tuoi dati localmente usando file `.json`.
- **Prezzi Resilienti e Cache**:
  - Usa una cache intelligente di 5 minuti per evitare troppi caricamenti.
  - "Proxy Fallback" automatico: se un server per i prezzi fallisce, ne prova subito un altro.
  - Inserimento Manuale: popup automatico per inserire il prezzo a mano se internet non dovesse funzionare.

## Installazione
Non serve installazione. Apri il file `index.html` nel tuo browser o caricalo su GitHub Pages (o simili). Tutti i dati rimarranno nel tuo PC.
