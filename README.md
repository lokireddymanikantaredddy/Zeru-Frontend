# Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation

A modern dashboard built with Next.js, React, Zustand, and ethers.js to track real-time gas prices across Ethereum, Polygon, and Arbitrum. Simulate wallet transactions and visualize gas price volatility with a live candlestick chart.

## Features

- **Real-Time Gas Engine**: Fetches live gas prices from Ethereum, Polygon, and Arbitrum using native WebSocket RPC endpoints (no third-party APIs).
- **Wallet Simulation**: Enter a transaction value to simulate and compare USD gas + transaction costs across all chains.
- **Live ETH/USD Pricing**: Calculates ETH/USD price by directly parsing Uniswap V3 Swap events (no Uniswap SDK).
- **Candlestick Chart**: Visualizes gas price volatility in 15-minute intervals using a custom interactive chart.
- **State Management**: Uses Zustand for a robust state machine supporting both live and simulation modes.
- **Responsive UI/UX**: Modern, dark-themed, and mobile-friendly dashboard with glassmorphism effects.

## How It Works

- **Web3 Integration**: Uses `ethers.providers.WebSocketProvider` for real-time block and gas updates.
- **Uniswap V3 Parsing**: Reads Swap events from the ETH/USDC pool to compute live ETH/USD price using the formula:
  ```js
  price = (sqrtPriceX96 / 2**96) ** 2 * 1e12
  ```
- **Simulation Mode**: Enter a value (ETH) to see the USD cost of a transfer on each chain, including gas and transaction value.
- **Candlestick Aggregation**: Gas data is aggregated into 15-minute candles for volatility visualization.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   ```
3. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app/components/Dashboard.tsx` — Main dashboard UI and logic
- `src/app/components/GasChart.tsx` — Custom candlestick chart component
- `src/app/utils/web3.ts` — Web3 utilities for gas and provider management
- `src/app/utils/uniswap.ts` — Uniswap V3 event parsing and ETH/USD price logic
- `src/app/store.ts` — Zustand state management

## Customization
- **RPC Endpoints**: Update your own WebSocket endpoints in `src/app/utils/web3.ts` for production use.
- **Uniswap Pool**: ETH/USD price is fetched from the official Uniswap V3 ETH/USDC pool.

## Deployment
Deploy easily to Vercel, Netlify, or your preferred platform. For Vercel:
```bash
vercel deploy
```

## License
MIT
