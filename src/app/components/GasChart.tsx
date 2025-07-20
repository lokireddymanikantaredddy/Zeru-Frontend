"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface GasCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function GasChart() {
  const { chains } = useStore();
  const [currentTime, setCurrentTime] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // For rendering
  const getCandlestickData = (): GasCandle[] => {
    const candles: { [key: number]: GasCandle } = {};
    const fifteenMinutes = 15 * 60 * 1000;
    Object.values(chains).forEach(chain => {
      chain.history.forEach(point => {
        const candleTime = Math.floor(point.timestamp / fifteenMinutes) * fifteenMinutes;
        const totalFee = point.baseFee + point.priorityFee;
        if (!candles[candleTime]) {
          candles[candleTime] = {
            time: candleTime,
            open: totalFee,
            high: totalFee,
            low: totalFee,
            close: totalFee,
            volume: 1,
          };
        } else {
          candles[candleTime].high = Math.max(candles[candleTime].high, totalFee);
          candles[candleTime].low = Math.min(candles[candleTime].low, totalFee);
          candles[candleTime].close = totalFee;
          candles[candleTime].volume += 1;
        }
      });
    });
    return Object.values(candles).sort((a, b) => a.time - b.time);
  };

  useEffect(() => {
    // For effect
    const getCandlestickData = (): GasCandle[] => {
      const candles: { [key: number]: GasCandle } = {};
      const fifteenMinutes = 15 * 60 * 1000;
      Object.values(chains).forEach(chain => {
        chain.history.forEach(point => {
          const candleTime = Math.floor(point.timestamp / fifteenMinutes) * fifteenMinutes;
          const totalFee = point.baseFee + point.priorityFee;
          if (!candles[candleTime]) {
            candles[candleTime] = {
              time: candleTime,
              open: totalFee,
              high: totalFee,
              low: totalFee,
              close: totalFee,
              volume: 1,
            };
          } else {
            candles[candleTime].high = Math.max(candles[candleTime].high, totalFee);
            candles[candleTime].low = Math.min(candles[candleTime].low, totalFee);
            candles[candleTime].close = totalFee;
            candles[candleTime].volume += 1;
          }
        });
      });
      return Object.values(candles).sort((a, b) => a.time - b.time);
    };
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [chains]);

  const candlestickData = getCandlestickData();

  return (
    <div className="gas-chart">
      <div className="chart-container">
        <h3 className="chart-title">Gas Price Volatility (15-min Candlesticks)</h3>
        {candlestickData.length > 0 ? (
          <div className="chart-content">
            <canvas 
              ref={canvasRef} 
              className="candlestick-canvas"
              style={{ width: '100%', height: '320px' }}
            />
          </div>
        ) : (
          <div className="no-data">
            <p>No gas price data available yet. Waiting for live updates...</p>
          </div>
        )}
        <div className="chart-info">
          <p>Showing 15-minute candlestick intervals of gas price volatility</p>
          <div className="data-summary">
            <div className="summary-item">
              <span className="summary-label">Total Candles:</span>
              <span className="summary-value">{candlestickData.length}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Data Points:</span>
              <span className="summary-value">
                {Object.values(chains).reduce((sum, chain) => sum + chain.history.length, 0)}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Last Updated:</span>
              <span className="summary-value">
                {currentTime || 'Loading...'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .gas-chart {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .chart-container {
          width: 100%;
        }
        .chart-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #e2e8f0;
          text-align: center;
        }
        .chart-content {
          margin-bottom: 1.5rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 1rem;
        }
        .candlestick-canvas {
          background: transparent;
          border-radius: 4px;
        }
        .no-data {
          text-align: center;
          padding: 2rem;
          color: #a0aec0;
        }
        .chart-info {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1rem;
        }
        .chart-info p {
          color: #a0aec0;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        .data-summary {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .summary-label {
          font-size: 0.75rem;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .summary-value {
          font-weight: 600;
          color: #e2e8f0;
        }
        @media (max-width: 768px) {
          .gas-chart {
            padding: 1rem;
          }
          .data-summary {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
} 