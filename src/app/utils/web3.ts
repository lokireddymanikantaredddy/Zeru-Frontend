import { WebSocketProvider, formatUnits } from 'ethers';
import { GasPoint } from '../store';

export const RPC_URLS = {
  ethereum: 'wss://eth-mainnet.g.alchemy.com/v2/68GpTxDt_UIGhd9jy9CUF476Cs8J5UPa',
  polygon: 'wss://polygon-mainnet.g.alchemy.com/v2/hcN6shlrV_gxuOqcTjjCr',
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

  const fetchGasPrice = async () => {
    try {
      const feeData = await provider.getFeeData();
      const baseFee = feeData.gasPrice ? Number(formatUnits(feeData.gasPrice, 'gwei')) : 0;
      const priorityFee = feeData.maxPriorityFeePerGas ? Number(formatUnits(feeData.maxPriorityFeePerGas, 'gwei')) : 2; // Default to 2 gwei if not available
      onGas({
        timestamp: Date.now(),
        baseFee,
        priorityFee,
      });
    } catch (error) {
      console.error(`Failed to fetch gas for ${chain}:`, error);
    }
  };

  // Fetch immediately and then poll every 10 seconds
  fetchGasPrice();
  const interval = setInterval(fetchGasPrice, 10000);

  // Return an object with a destroy method to clean up the interval and provider
  return {
    destroy: () => {
      clearInterval(interval);
      provider.destroy();
    },
  };
} 