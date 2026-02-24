import { useState, useEffect, useCallback } from 'react'
import { web3Service } from '../services/web3'
import { ethers } from 'ethers'

export const useWallet = () => {
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const switchToAmoy = useCallback(async () => {
    if (!window.ethereum) return false
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x13882' }] // CORRECT: 80002 in hex
      })
      console.log('Switched to Amoy network')
      return true
    } catch (error) {
      if (error.code === 4902) {
        // Chain not added yet
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x13882', // CORRECT
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: {
                name: 'POL',
                symbol: 'POL',
                decimals: 18
              },
              rpcUrls: ['https://rpc-amoy.polygon.technology/'],
              blockExplorerUrls: ['https://amoy.polygonscan.com/']
            }]
          })
          console.log('Added and switched to Amoy network')
          return true
        } catch (addError) {
          console.error('Error adding Amoy network:', addError)
          return false
        }
      } else {
        console.error('Error switching network:', error)
        return false
      }
    }
  }, [])

  const connect = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Connecting wallet...')
      
      // FIRST: Check and switch network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('Current chain ID:', chainId)
      
      if (chainId !== '0x13882') { // CORRECT
        console.log('Wrong network, attempting to switch...')
        const switched = await switchToAmoy()
        if (!switched) {
          throw new Error('Please switch to Polygon Amoy Testnet manually')
        }
        // Give MetaMask a moment to switch
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      // SECOND: Initialize web3 with correct network
      await web3Service.init()
      const address = web3Service.getAddress()
      console.log('Connected address:', address)
      
      setAccount(address)
      setIsConnected(true)
      
      // Get POL balance
      if (web3Service.provider) {
        const balance = await web3Service.provider.getBalance(address)
        setBalance(ethers.formatEther(balance))
        console.log('Balance:', ethers.formatEther(balance))
      }
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [switchToAmoy])

  const disconnect = useCallback(() => {
    setAccount(null)
    setBalance(null)
    setIsConnected(false)
  }, [])

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            console.log('Already connected:', accounts[0])
            // Check network before auto-connecting
            const chainId = await window.ethereum.request({ method: 'eth_chainId' })
            if (chainId === '0x13882') { // CORRECT
              await connect()
            } else {
              console.log('Connected but wrong network - please switch to Amoy')
            }
          }
        } catch (err) {
          console.error('Error checking connection:', err)
        }
      }
    }
    
    checkConnection()
  }, [connect])

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        console.log('Accounts changed:', accounts)
        if (accounts.length > 0) {
          setAccount(accounts[0])
          setIsConnected(true)
        } else {
          disconnect()
        }
      }

      const handleChainChanged = (chainId) => {
        console.log('Chain changed to:', chainId)
        window.location.reload()
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [disconnect])

  return { account, balance, isConnected, isLoading, error, connect, disconnect, switchToAmoy }
}



// import { useState, useEffect, useCallback } from 'react'
// import { web3Service } from '../services/web3'
// import { ethers } from 'ethers'

// export const useWallet = () => {
//   const [account, setAccount] = useState(null)
//   const [balance, setBalance] = useState(null)
//   const [isConnected, setIsConnected] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [error, setError] = useState(null)

//   const switchToAmoy = useCallback(async () => {
//     if (!window.ethereum) return
    
//     try {
//       await window.ethereum.request({
//         method: 'wallet_switchEthereumChain',
//         params: [{ chainId: '0x13881' }] // 80002 in hex
//       })
//       console.log('Switched to Amoy network')
//     } catch (error) {
//       if (error.code === 4902) {
//         // Chain not added yet
//         try {
//           await window.ethereum.request({
//             method: 'wallet_addEthereumChain',
//             params: [{
//               chainId: '0x13881',
//               chainName: 'Polygon Amoy Testnet',
//               nativeCurrency: {
//                 name: 'POL',
//                 symbol: 'POL',
//                 decimals: 18
//               },
//               rpcUrls: ['https://rpc-amoy.polygon.technology/'],
//               blockExplorerUrls: ['https://amoy.polygonscan.com/']
//             }]
//           })
//           console.log('Added and switched to Amoy network')
//         } catch (addError) {
//           console.error('Error adding Amoy network:', addError)
//           throw addError
//         }
//       } else {
//         console.error('Error switching network:', error)
//         throw error
//       }
//     }
//   }, [])

//   const connect = useCallback(async () => {
//     setIsLoading(true)
//     setError(null)
//     try {
//       console.log('Connecting wallet...')
//       await web3Service.init()
//       const address = web3Service.getAddress()
//       console.log('Connected address:', address)
      
//       setAccount(address)
//       setIsConnected(true)
      
//       // Get POL balance
//       if (web3Service.provider) {
//         const balance = await web3Service.provider.getBalance(address)
//         setBalance(ethers.formatEther(balance))
//         console.log('Balance:', ethers.formatEther(balance))
//       }
//     } catch (err) {
//       console.error('Connection error:', err)
//       setError(err.message)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   const disconnect = useCallback(() => {
//     setAccount(null)
//     setBalance(null)
//     setIsConnected(false)
//   }, [])

//   useEffect(() => {
//     // Check if already connected
//     const checkConnection = async () => {
//       if (window.ethereum) {
//         try {
//           const accounts = await window.ethereum.request({ method: 'eth_accounts' })
//           if (accounts.length > 0) {
//             console.log('Already connected:', accounts[0])
//             await connect()
//           }
//         } catch (err) {
//           console.error('Error checking connection:', err)
//         }
//       }
//     }
    
//     checkConnection()
//   }, [connect])

//   useEffect(() => {
//     if (window.ethereum) {
//       const handleAccountsChanged = (accounts) => {
//         console.log('Accounts changed:', accounts)
//         if (accounts.length > 0) {
//           setAccount(accounts[0])
//           setIsConnected(true)
//         } else {
//           disconnect()
//         }
//       }

//       const handleChainChanged = () => {
//         window.location.reload()
//       }

//       window.ethereum.on('accountsChanged', handleAccountsChanged)
//       window.ethereum.on('chainChanged', handleChainChanged)

//       return () => {
//         window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
//         window.ethereum.removeListener('chainChanged', handleChainChanged)
//       }
//     }
//   }, [disconnect])

//   return { account, balance, isConnected, isLoading, error, connect, disconnect, switchToAmoy }
// }