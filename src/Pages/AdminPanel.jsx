import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { ethers } from 'ethers'

export const AdminPanel = () => {
  const { isConnected, account } = useWallet()
  const { contracts, isLoading, error, loadContracts } = useContracts()
  
  const [founderWallets, setFounderWallets] = useState([])
  const [founderRatios, setFounderRatios] = useState([])
  const [newWallet, setNewWallet] = useState('')
  const [newRatio, setNewRatio] = useState('1250')
  const [repAddress, setRepAddress] = useState('')
  const [nftPool, setNftPool] = useState('')
  const [opsWallet, setOpsWallet] = useState('')
  const [txStatus, setTxStatus] = useState({ loading: false, hash: null, error: null })
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!contracts || !account) return

      try {
        // Check if user is owner
        const owner = await contracts.levelManager.owner()
        setIsOwner(owner.toLowerCase() === account.toLowerCase())

        // Get founder wallets
        const wallets = await contracts.levelManager.getFounderWallets()
        setFounderWallets(wallets[0])
        setFounderRatios(wallets[1].map(r => r.toString()))

        // Get current charge recipients
        const nft = await contracts.levelManager.nftPool()
        const ops = await contracts.levelManager.operationsWallet()
        setNftPool(nft)
        setOpsWallet(ops)

      } catch (err) {
        console.error('Error fetching admin data:', err)
      }
    }

    fetchAdminData()
  }, [contracts, account])

  const handleAddFounderWallet = async () => {
    if (!newWallet) return
    
    const newWallets = [...founderWallets, newWallet]
    const newRatios = [...founderRatios, newRatio]
    
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.levelManager.setFounderWallets(newWallets, newRatios)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      setFounderWallets(newWallets)
      setFounderRatios(newRatios)
      setNewWallet('')
      setNewRatio('1250')
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const handleAddFounderRep = async () => {
    if (!repAddress) return
    
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.levelManager.setFounderRepresentatives([repAddress])
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      setRepAddress('')
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const handleUpdateChargeRecipients = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.levelManager.updateChargeRecipients(nftPool, opsWallet)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  if (!isConnected) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          Please connect your wallet to access admin panel
        </Alert>
      </Container>
    )
  }

  if (!isOwner) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          You are not the contract owner. Admin access restricted.
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading admin data...</p>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Admin Panel</h1>

      {txStatus.error && (
        <Alert variant="danger" className="mb-3" dismissible>
          {txStatus.error}
        </Alert>
      )}

      {txStatus.hash && (
        <Alert variant="info" className="mb-3">
          Transaction: <a 
            href={`https://amoy.polygonscan.com/tx/${txStatus.hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {txStatus.hash.slice(0, 10)}...{txStatus.hash.slice(-8)}
          </a>
        </Alert>
      )}

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header as="h5">Founder Wallets</Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Wallet Address</th>
                    <th>Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {founderWallets.map((wallet, index) => (
                    <tr key={index}>
                      <td>{wallet.slice(0, 6)}...{wallet.slice(-4)}</td>
                      <td>{(parseInt(founderRatios[index]) / 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <h6 className="mt-3">Add New Founder Wallet</h6>
              <Form.Group className="mb-2">
                <Form.Label>Wallet Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x..."
                  value={newWallet}
                  onChange={(e) => setNewWallet(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Ratio (1-10000, default 1250 = 12.5%)</Form.Label>
                <Form.Control
                  type="number"
                  value={newRatio}
                  onChange={(e) => setNewRatio(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleAddFounderWallet}
                disabled={txStatus.loading || !newWallet}
              >
                Add Founder Wallet
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header as="h5">Founder Representatives</Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Representative Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x..."
                  value={repAddress}
                  onChange={(e) => setRepAddress(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleAddFounderRep}
                disabled={txStatus.loading || !repAddress}
              >
                Add Founder Representative
              </Button>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Charge Recipients</Card.Header>
            <Card.Body>
              <Form.Group className="mb-2">
                <Form.Label>NFT Pool Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x..."
                  value={nftPool}
                  onChange={(e) => setNftPool(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Operations Wallet Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="0x..."
                  value={opsWallet}
                  onChange={(e) => setOpsWallet(e.target.value)}
                />
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUpdateChargeRecipients}
                disabled={txStatus.loading}
              >
                Update Recipients
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}