import { ethers } from 'ethers'
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../constants/addresses'

// ABIs will be added here
import USDT_ABI from '../abis/USDT.json'
import ESCROW_ABI from '../abis/AutoUpgradeEscrow.json'
import REGISTRATION_ABI from '../abis/RegistrationFixed.json'
import LEVEL_MANAGER_ABI from '../abis/LevelManager.json'
import ORBIT_ABI from '../abis/OrbitBase.json'

export class Web3Service {
  constructor() {
    this.provider = null
    this.signer = null
    this.contracts = {}
  }

  async init() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    this.provider = new ethers.BrowserProvider(window.ethereum)
    await this.provider.send('eth_requestAccounts', [])
    this.signer = await this.provider.getSigner()

    // Initialize contracts
    this.contracts = {
      usdt: new ethers.Contract(CONTRACT_ADDRESSES.USDT, USDT_ABI, this.signer),
      escrow: new ethers.Contract(CONTRACT_ADDRESSES.ESCROW, ESCROW_ABI, this.signer),
      registration: new ethers.Contract(CONTRACT_ADDRESSES.REGISTRATION, REGISTRATION_ABI, this.signer),
      levelManager: new ethers.Contract(CONTRACT_ADDRESSES.LEVEL_MANAGER, LEVEL_MANAGER_ABI, this.signer),
      p4Orbit: new ethers.Contract(CONTRACT_ADDRESSES.P4_ORBIT, ORBIT_ABI, this.signer),
      p12Orbit: new ethers.Contract(CONTRACT_ADDRESSES.P12_ORBIT, ORBIT_ABI, this.signer),
      p39Orbit: new ethers.Contract(CONTRACT_ADDRESSES.P39_ORBIT, ORBIT_ABI, this.signer)
    }

    return this.contracts
  }

  async switchToAmoy() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }]
      })
    } catch (error) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [NETWORK_CONFIG]
        })
      } else {
        throw error
      }
    }
  }

  getAddress() {
    return this.signer?.address
  }
}

export const web3Service = new Web3Service()