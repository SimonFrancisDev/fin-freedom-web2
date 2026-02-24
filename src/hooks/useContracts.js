import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { web3Service } from '../services/web3'

export const useContracts = () => {
  const [contracts, setContracts] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadContracts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const contracts = await web3Service.init()
      setContracts(contracts)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return { contracts, isLoading, error, loadContracts }
}