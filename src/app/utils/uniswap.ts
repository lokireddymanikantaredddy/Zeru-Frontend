import { ethers, Interface } from 'ethers';

export const UNISWAP_V3_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';
export const SWAP_TOPIC = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67';
export const USDC_ADDRESS = '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C';

let lastPriceFetch = 0;
let cachedPrice = 0;
const PRICE_CACHE_DURATION = 30000;
const MIN_FETCH_INTERVAL = 10000;

function calculatePriceFromSqrtPriceX96(sqrtPriceX96: bigint): number {
  const Q96 = BigInt(2) ** BigInt(96);
  const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
  const price = (sqrtPrice * sqrtPrice) * (10 ** 12);
  return price;
}

export async function fetchUniswapPrice(provider: any): Promise<number> {
  try {
    const latestBlock = await provider.getBlockNumber();
    const logs = await provider.getLogs({
      address: UNISWAP_V3_POOL,
      topics: [SWAP_TOPIC],
      fromBlock: latestBlock - 100,
      toBlock: latestBlock,
    });
    if (logs.length === 0) {
      throw new Error('No Swap events found');
    }
    const latestLog = logs[logs.length - 1];
    const iface = new Interface([
      'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
    ]);
    const parsedLog = iface.parseLog(latestLog);
    if (!parsedLog) {
      throw new Error('Failed to parse Swap event log');
    }
    const sqrtPriceX96 = parsedLog.args.sqrtPriceX96;
    const price = calculatePriceFromSqrtPriceX96(sqrtPriceX96);
    if (price < 100 || price > 10000) {
      throw new Error(`Unreasonable price calculated: $${price}`);
    }
    console.log(`ETH/USD price from Uniswap V3: $${price.toFixed(2)}`);
    return price;
  } catch (error) {
    console.warn('Error fetching Uniswap V3 price:', error);
    throw error;
  }
}

export async function fetchETHPrice(): Promise<number> {
  const now = Date.now();
  if (now - lastPriceFetch < PRICE_CACHE_DURATION && cachedPrice > 0) {
    return cachedPrice;
  }
  if (now - lastPriceFetch < MIN_FETCH_INTERVAL) {
    return cachedPrice || 0;
  }
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GasTracker/1.0',
        },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    const price = data.ethereum?.usd;
    if (price && typeof price === 'number' && price > 0) {
      cachedPrice = price;
      lastPriceFetch = now;
      console.log(`Current ETH/USD price from API: ${price}`);
      return price;
    } else {
      throw new Error('Invalid price data received');
    }
  } catch (error) {
    console.warn('Error fetching ETH price from API:', error);
    return cachedPrice || 0;
  }
}

export function getFallbackPrice(): number {
  return 3500;
}

export async function getETHPrice(provider?: any): Promise<number> {
  if (provider) {
    try {
      const uniswapPrice = await fetchUniswapPrice(provider);
      if (uniswapPrice > 0) {
        cachedPrice = uniswapPrice;
        lastPriceFetch = Date.now();
        return uniswapPrice;
      }
    } catch (error) {
      console.warn('Uniswap V3 price fetch failed, trying fallback:', error);
    }
  }
  const apiPrice = await fetchETHPrice();
  if (apiPrice > 0) {
    return apiPrice;
  }
  return getFallbackPrice();
} 