import { create } from 'zustand';

export type Mode = 'live' | 'simulation';

export type GasPoint = {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
};

export type ChainGasData = {
  baseFee: number;
  priorityFee: number;
  history: GasPoint[];
};

export type ChainsState = {
  ethereum: ChainGasData;
  polygon: ChainGasData;
  arbitrum: ChainGasData;
};

interface StoreState {
  mode: Mode;
  chains: ChainsState;
  usdPrice: number;
  setMode: (mode: Mode) => void;
  updateChain: (chain: keyof ChainsState, data: Partial<ChainGasData>) => void;
  setUsdPrice: (price: number) => void;
  addGasPoint: (chain: keyof ChainsState, point: GasPoint) => void;
}

const initialChain: ChainGasData = {
  baseFee: 0,
  priorityFee: 0,
  history: [],
};

export const useStore = create<StoreState>((set) => ({
  mode: 'live',
  chains: {
    ethereum: { ...initialChain },
    polygon: { ...initialChain },
    arbitrum: { ...initialChain },
  },
  usdPrice: 0,
  setMode: (mode) => set({ mode }),
  updateChain: (chain, data) => set((state) => ({
    chains: {
      ...state.chains,
      [chain]: {
        ...state.chains[chain],
        ...data,
      },
    },
  })),
  setUsdPrice: (price) => set({ usdPrice: price }),
  addGasPoint: (chain, point) => set((state) => ({
    chains: {
      ...state.chains,
      [chain]: {
        ...state.chains[chain],
        history: [...state.chains[chain].history, point],
      },
    },
  })),
})); 