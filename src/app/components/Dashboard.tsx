"use client";
import React, { useEffect, useState, useRef } from "react";
import { useStore } from "../store";
import { subscribeGas, getProvider } from "../utils/web3";
import { getETHPrice } from '../utils/uniswap';
import GasChart from "./GasChart";

export default function Dashboard() {
  const { mode, chains, usdPrice, setMode, setUsdPrice, updateChain, addGasPoint } = useStore();
  const [txValue, setTxValue] = useState(0.1);
  const [providers, setProviders] = useState<{ [key: string]: any }>({});
  const providersRef = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    providersRef.current = providers;
  }, [providers]);

  useEffect(() => {
    const _providers: { [key: string]: any } = {};
    
    if (mode === "live") {
      _providers["ethereum"] = subscribeGas("ethereum", (gas) => {
        updateChain("ethereum", { baseFee: gas.baseFee, priorityFee: gas.priorityFee });
        addGasPoint("ethereum", gas);
      });
      _providers["polygon"] = subscribeGas("polygon", (gas) => {
        updateChain("polygon", { baseFee: gas.baseFee, priorityFee: gas.priorityFee });
        addGasPoint("polygon", gas);
      });
      _providers["arbitrum"] = subscribeGas("arbitrum", (gas) => {
        updateChain("arbitrum", { baseFee: gas.baseFee, priorityFee: gas.priorityFee });
        addGasPoint("arbitrum", gas);
      });
    } else {
      _providers["ethereum"] = getProvider("ethereum");
      _providers["polygon"] = getProvider("polygon");
      _providers["arbitrum"] = getProvider("arbitrum");
    }

    const ethProvider = _providers["ethereum"] || getProvider("ethereum");
    if (ethProvider._websocket) {
      ethProvider._websocket.on('error', (err: any) => console.error('ETH WebSocket error:', err));
      ethProvider._websocket.on('close', () => console.error('ETH WebSocket closed'));
    }
    setProviders(_providers);
    return () => {
      Object.values(_providers).forEach((p: any) => p?.destroy?.());
    };
  }, [mode, updateChain, addGasPoint]);

  useEffect(() => {
    let stopped = false;
    
    const pollPrice = async () => {
      if (stopped) return;
      try {
        const ethProvider = providersRef.current["ethereum"];
        const price = await getETHPrice(ethProvider);
        console.log('Current ETH/USD price:', price);
        useStore.getState().setUsdPrice(price);
      } catch (error) {
        console.warn('Error polling ETH price:', error);
      }
    };

    pollPrice();
    
    const interval = setInterval(pollPrice, 30000);
    
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  function getCost(chain: keyof typeof chains) {
    const { baseFee, priorityFee } = chains[chain];
    const gasUsed = 21000;
    const totalGasCost = (baseFee + priorityFee) * gasUsed;
    const gasCostInETH = totalGasCost / (10 ** 9);
    const totalCostInETH = gasCostInETH + (mode === "simulation" ? txValue : 0);
    return (totalCostInETH * usdPrice).toFixed(2);
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h1 className="dashboard-title">Cross-Chain Gas Price Tracker</h1>
          <div className="mode-selector">
            <button 
              className={`mode-btn ${mode === "live" ? "active" : ""}`}
              onClick={() => setMode("live")}
            >
              Live Mode
            </button>
            <button 
              className={`mode-btn ${mode === "simulation" ? "active" : ""}`}
              onClick={() => setMode("simulation")}
            >
              Simulation Mode
            </button>
          </div>
        </header>

        {mode === "simulation" && (
          <div className="simulation-controls">
            <label className="simulation-label">Transaction Value (ETH):</label>
            <input 
              type="number" 
              value={txValue} 
              onChange={e => setTxValue(Number(e.target.value))} 
              min={0.001} 
              step={0.001}
              className="simulation-input"
              placeholder="0.1"
            />
            <span className="simulation-hint">Enter amount to simulate transaction costs</span>
          </div>
        )}

        <section className="gas-cost-section">
          <h2 className="section-title">Current Gas & USD Cost</h2>
          <div className="table-container">
            <table className="gas-table">
              <thead>
                <tr>
                  <th>Chain</th>
                  <th>Base Fee (Gwei)</th>
                  <th>Priority Fee (Gwei)</th>
                  <th>ETH/USD</th>
                  <th>Tx Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(chains).map((chain) => (
                  <tr key={chain} className="table-row">
                    <td className="chain-name">{chain}</td>
                    <td className="gas-value">{chains[chain as keyof typeof chains].baseFee.toFixed(2)}</td>
                    <td className="gas-value">{chains[chain as keyof typeof chains].priorityFee.toFixed(2)}</td>
                    <td className="price-value">${usdPrice.toFixed(2)}</td>
                    <td className="cost-value">${getCost(chain as keyof typeof chains)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="chart-section">
          <h2 className="section-title">Gas Price Volatility (15-min Candles)</h2>
          <div className="chart-container">
            <GasChart />
          </div>
        </section>
      </div>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .mode-selector {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .mode-btn {
          padding: 0.75rem 1.5rem;
          border: 2px solid #667eea;
          background: transparent;
          color: #ffffff;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mode-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .mode-btn.active {
          background: #667eea;
          color: #ffffff;
        }

        .simulation-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .simulation-label {
          font-weight: 600;
          color: #e2e8f0;
        }

        .simulation-input {
          padding: 0.5rem 1rem;
          border: 1px solid #4a5568;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          outline: none;
          transition: border 0.2s;
        }

        .simulation-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .simulation-hint {
          font-size: 0.875rem;
          color: #a0aec0;
          margin-top: 0.5rem;
        }

        .gas-cost-section {
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .table-container {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .gas-table {
          width: 100%;
          border-collapse: collapse;
        }

        .gas-table th, .gas-table td {
          padding: 0.75rem 1.25rem;
          text-align: left;
        }

        .gas-table th {
          background: #23234a;
          color: #a0aec0;
          font-weight: 700;
        }

        .gas-table tr {
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .gas-table tr:last-child {
          border-bottom: none;
        }

        .chain-name {
          font-weight: 600;
          color: #667eea;
        }

        .gas-value {
          color: #e2e8f0;
        }

        .price-value {
          color: #27ae60;
          font-weight: 600;
        }

        .cost-value {
          color: #ff9800;
          font-weight: 600;
        }

        .chart-section {
          margin-top: 2rem;
        }

        .chart-container {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
      `}</style>
    </div>
  );
} 