export const CONTRACT_ADDRESSES = {
  USDT: import.meta.env.VITE_USDT_ADDRESS,
  ESCROW: import.meta.env.VITE_ESCROW_ADDRESS,
  REGISTRATION: import.meta.env.VITE_REGISTRATION_ADDRESS,
  LEVEL_MANAGER: import.meta.env.VITE_LEVELMANAGER_ADDRESS,
  P4_ORBIT: import.meta.env.VITE_P4_ORBIT_ADDRESS,
  P12_ORBIT: import.meta.env.VITE_P12_ORBIT_ADDRESS,
  P39_ORBIT: import.meta.env.VITE_P39_ORBIT_ADDRESS
}

export const NETWORK_CONFIG = {
  chainId: '0x13881', // 80002 in hex
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'POL',
    symbol: 'POL',
    decimals: 18
  },
  rpcUrls: [import.meta.env.VITE_AMOY_RPC_URL],
  blockExplorerUrls: ['https://amoy.polygonscan.com/']
}