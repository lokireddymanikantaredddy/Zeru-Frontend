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
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const candlestickData = getCandlestickData();
    if (candlestickData.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, rect.width, rect.height);
    const padding = 40;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const prices = candlestickData.flatMap(candle => [candle.high, candle.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const candleWidth = Math.min(20, chartWidth / candlestickData.length - 2);
    const candleSpacing = chartWidth / candlestickData.length;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 10; i++) {
      const x = padding + (chartWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, padding + chartHeight);
      ctx.stroke();
    }
    candlestickData.forEach((candle, index) => {
      const x = padding + index * candleSpacing + candleSpacing / 2 - candleWidth / 2;
      const openY = padding + chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
      const closeY = padding + chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
      const highY = padding + chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
      const lowY = padding + chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;
      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.strokeStyle = isGreen ? '#26a69a' : '#ef5350';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      const bodyY = Math.min(openY, closeY);
      ctx.fillRect(x, bodyY, candleWidth, bodyHeight);
      ctx.strokeRect(x, bodyY, candleWidth, bodyHeight);
    });
    ctx.fillStyle = '#a0aec0';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = maxPrice - (priceRange / 5) * i;
      const y = padding + (chartHeight / 5) * i + 4;
      ctx.fillText(`${price.toFixed(2)} Gwei`, padding - 10, y);
    }
    ctx.textAlign = 'center';
    const timeStep = Math.max(1, Math.floor(candlestickData.length / 5));
    for (let i = 0; i < candlestickData.length; i += timeStep) {
      const x = padding + i * candleSpacing + candleSpacing / 2;
      const time = new Date(candlestickData[i].time);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, x, rect.height - 10);
    }
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