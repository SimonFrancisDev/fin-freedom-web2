import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Table, Alert, Spinner } from 'react-bootstrap'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { ethers } from 'ethers'

export const FounderPanel = () => {
  const { isConnected, account } = useWallet()
  const { contracts, isLoading, error, loadContracts } = useContracts()
  
  const [founderWallets, setFounderWallets] = useState([])
  const [founderRatios, setFounderRatios] = useState([])
  const [walletBalances, setWalletBalances] = useState({})
  const [id1Wallet, setId1Wallet] = useState('')
  const [isID1Downline, setIsID1Downline] = useState(false)

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchFounderData = async () => {
      if (!contracts || !account) return

      try {
        // Get founder wallets
        const wallets = await contracts.levelManager.getFounderWallets()
        setFounderWallets(wallets[0])
        setFounderRatios(wallets[1].map(r => r.toString()))

        // Get ID1 wallet
        const id1 = await contracts.levelManager.id1Wallet()
        setId1Wallet(id1)

        // Check if current user is ID1 downline
        const isDownline = await contracts.levelManager.isID1Downline(account)
        setIsID1Downline(isDownline)

        // Get balances for each founder wallet
        const balances = {}
        for (const wallet of wallets[0]) {
          const balance = await contracts.usdt.balanceOf(wallet)
          balances[wallet] = ethers.formatUnits(balance, 6)
        }
        setWalletBalances(balances)

      } catch (err) {
        console.error('Error fetching founder data:', err)
      }
    }

    fetchFounderData()
  }, [contracts, account])

  if (!isConnected) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          Please connect your wallet to view founder panel
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading founder data...</p>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Founder Panel</h1>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>ID1 Status</Card.Title>
              <Card.Text>
                <strong>ID1 Wallet:</strong> {id1Wallet || 'Not set'}<br />
                <strong>Your Account:</strong> {account}<br />
                <strong>ID1 Downline:</strong> {isID1Downline ? '✅ Yes' : '❌ No'}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <Card.Header as="h5">Founder Wallets Distribution</Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>Ratio</th>
                    <th>Current Balance (USDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {founderWallets.map((wallet, index) => (
                    <tr key={index}>
                      <td>
                        <a 
                          href={`https://amoy.polygonscan.com/address/${wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {wallet.slice(0, 6)}...{wallet.slice(-4)}
                        </a>
                      </td>
                      <td>{(parseInt(founderRatios[index]) / 100).toFixed(2)}%</td>
                      <td>{walletBalances[wallet] || '0'} USDT</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="text-muted mt-2">
                Each founder receives 1.125 USDT (12.5%) when an ID1 downline activates Level 1
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}