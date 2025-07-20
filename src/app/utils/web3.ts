import { WebSocketProvider, formatUnits } from 'ethers';
import { GasPoint } from '../store';

// Replace with your own or public WebSocket endpoints
export const RPC_URLS = {
  ethereum: 'wss://eth-mainnet.g.alchemy.com/v2/68GpTxDt_UIGhd9jy9CUF476Cs8J5UPa',
  polygon: 'wss://polygon-mainnet.g.alchemy.com/v2/hcN6shlrV_gxuOqcTjjCr', // Polygon public endpoint (may not support WS, replace if needed)
  arbitrum: 'wss://arb-mainnet.g.alchemy.com/v2/AWUrAoQ9ICbPpuiYtHJWH',
};

export function getProvider(chain: keyof typeof RPC_URLS) {
  return new WebSocketProvider(RPC_URLS[chain]);
}

export function subscribeGas(
  chain: keyof typeof RPC_URLS,
  onGas: (gas: GasPoint) => void
) {
  const provider = getProvider(chain);
  provider.on('block', async (blockNumber: number) => {
    const block = await provider.getBlock(blockNumber);
    if (!block) return;
    // For EIP-1559 chains
    const baseFee = block.baseFeePerGas ? Number(formatUnits(block.baseFeePerGas, 'gwei')) : 0;
    // Estimate priority fee (not always available, fallback to 2 gwei)
    let priorityFee = 2;
    if (provider.send) {
      try {
        const tip = await provider.send('eth_maxPriorityFeePerGas', []);
        priorityFee = Number(formatUnits(tip, 'gwei'));
      } catch {}
    }
    onGas({
      timestamp: Date.now(),
      baseFee,
      priorityFee,
    });
  });
  return provider;
} 