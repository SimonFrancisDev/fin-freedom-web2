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

  // ADMIN TERMINAL STYLES
  const adminStyles = `
    .admin-card {
      background: white;
      border: 1px solid rgba(0, 35, 102, 0.1);
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 35, 102, 0.05);
      overflow: hidden;
      height: 100%;
    }
    .admin-header {
      background: #002366;
      color: white;
      font-family: 'monospace';
      font-size: 0.8rem;
      padding: 12px 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .input-field {
      border: 1px solid #e0e6ed;
      border-radius: 8px;
      padding: 10px;
      font-family: 'monospace';
      font-size: 0.9rem;
      background: #fcfdfe;
    }
    .input-field:focus {
      border-color: #0044cc;
      box-shadow: 0 0 0 3px rgba(0, 68, 204, 0.1);
    }
    .command-btn {
      background: #002366;
      border: none;
      border-radius: 8px;
      padding: 10px 20px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 0.75rem;
      transition: all 0.3s ease;
    }
    .command-btn:hover:not(:disabled) {
      background: #0044cc;
      transform: translateY(-2px);
    }
    .command-btn:disabled {
      background: #cccccc;
    }
    .log-table {
      font-size: 0.85rem;
      border: none;
    }
    .log-table thead th {
      background: #f8fafd;
      text-transform: uppercase;
      font-size: 0.7rem;
      border: none;
      padding: 12px;
    }
    .pulse-bar {
      height: 4px;
      background: linear-gradient(90deg, #002366, #0044cc, #002366);
      background-size: 200% 100%;
      animation: pulse-line 3s linear infinite;
    }
    @keyframes pulse-line {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
  `;

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!contracts || !account) return

      try {
        const owner = await contracts.levelManager.owner()
        setIsOwner(owner.toLowerCase() === account.toLowerCase())

        const wallets = await contracts.levelManager.getFounderWallets()
        setFounderWallets(wallets[0])
        setFounderRatios(wallets[1].map(r => r.toString()))

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
      <Container className="mt-5 pt-5">
        <Alert variant="info" className="p-5 text-center admin-card border-0">
          <h4 className="fw-bold">TERMINAL CONNECTION REQUIRED</h4>
          <p className="mb-0">Please connect an authorized wallet to initialize admin sequences.</p>
        </Alert>
      </Container>
    )
  }

  if (!isOwner) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="p-4 admin-card border-0 shadow">
          <h5 className="fw-bold">ACCESS_DENIED</h5>
          <p className="mb-0">Unauthorized signature detected. This terminal is restricted to contract owners only.</p>
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 fw-bold text-muted" style={{letterSpacing: '2px'}}>AUTHORIZING_ADMIN...</p>
      </Container>
    )
  }

  return (
    <Container className="mt-5 pt-4 pb-5">
      <style>{adminStyles}</style>
      
      <div className="d-flex align-items-center mt-5 mb-4">
        <div style={{height: '35px', width: '8px', background: '#002366', marginRight: '15px'}}></div>
        <h1 className="m-0 fw-black text-uppercase" style={{color: '#002366', letterSpacing: '2px', fontSize: '2rem'}}>Admin Command</h1>
      </div>

      {txStatus.error && (
        <Alert variant="danger" className="mb-4 border-0 shadow-sm" dismissible>
          <strong className="text-uppercase" style={{fontSize: '0.7rem'}}>Execution_Error:</strong> {txStatus.error}
        </Alert>
      )}

      {txStatus.hash && (
        <Alert variant="primary" className="mb-4 border-0 shadow-sm bg-dark text-white">
          <div className="small text-uppercase opacity-50 mb-1" style={{letterSpacing: '1px'}}>Transaction_Broadcast</div>
          <a href={`https://amoy.polygonscan.com/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer" className="text-info text-decoration-none fw-bold" style={{fontFamily: 'monospace'}}>
            {txStatus.hash}
          </a>
        </Alert>
      )}

      <Row>
        <Col lg={6} className="mb-4">
          <div className="admin-card">
            <div className="admin-header">
              <span>Founder_Registry</span>
              <span className="badge bg-primary px-2">Total: {founderWallets.length}</span>
            </div>
            <div className="pulse-bar"></div>
            <div className="p-4">
              <Table responsive className="log-table mb-4">
                <thead>
                  <tr>
                    <th>Node_Address</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {founderWallets.map((wallet, index) => (
                    <tr key={index}>
                      <td className="fw-bold text-primary" style={{fontFamily: 'monospace'}}>{wallet.slice(0, 10)}...{wallet.slice(-8)}</td>
                      <td>{(parseInt(founderRatios[index]) / 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <hr className="my-4" />
              
              <h6 className="text-uppercase fw-bold mb-3" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>Inject New Node</h6>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">Wallet Address</Form.Label>
                <Form.Control className="input-field" type="text" placeholder="0x..." value={newWallet} onChange={(e) => setNewWallet(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">Ratio Weight (Basis Points)</Form.Label>
                <Form.Control className="input-field" type="number" value={newRatio} onChange={(e) => setNewRatio(e.target.value)} />
              </Form.Group>
              <Button className="command-btn w-100" onClick={handleAddFounderWallet} disabled={txStatus.loading || !newWallet}>
                {txStatus.loading ? 'Executing_Sequence...' : 'Authorize Founder Wallet'}
              </Button>
            </div>
          </div>
        </Col>

        <Col lg={6}>
          <div className="admin-card mb-4">
            <div className="admin-header">Representative_Override</div>
            <div className="pulse-bar"></div>
            <div className="p-4">
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">Representative Address</Form.Label>
                <Form.Control className="input-field" type="text" placeholder="0x..." value={repAddress} onChange={(e) => setRepAddress(e.target.value)} />
              </Form.Group>
              <Button className="command-btn w-100" onClick={handleAddFounderRep} disabled={txStatus.loading || !repAddress}>
                {txStatus.loading ? 'Executing_Sequence...' : 'Update Representative'}
              </Button>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-header">Charge_Routing_Protocol</div>
            <div className="pulse-bar"></div>
            <div className="p-4">
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted fw-bold">NFT Pool Uplink</Form.Label>
                <Form.Control className="input-field" type="text" value={nftPool} onChange={(e) => setNftPool(e.target.value)} />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="small text-muted fw-bold">Operations Hub Address</Form.Label>
                <Form.Control className="input-field" type="text" value={opsWallet} onChange={(e) => setOpsWallet(e.target.value)} />
              </Form.Group>
              <Button className="command-btn w-100" onClick={handleUpdateChargeRecipients} disabled={txStatus.loading}>
                {txStatus.loading ? 'Executing_Sequence...' : 'Commit Protocol Updates'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}




// import React, { useState, useEffect } from 'react'
// import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap'
// import { useWallet } from '../hooks/useWallet'
// import { useContracts } from '../hooks/useContracts'
// import { ethers } from 'ethers'

// export const AdminPanel = () => {
//   const { isConnected, account } = useWallet()
//   const { contracts, isLoading, error, loadContracts } = useContracts()
  
//   const [founderWallets, setFounderWallets] = useState([])
//   const [founderRatios, setFounderRatios] = useState([])
//   const [newWallet, setNewWallet] = useState('')
//   const [newRatio, setNewRatio] = useState('1250')
//   const [repAddress, setRepAddress] = useState('')
//   const [nftPool, setNftPool] = useState('')
//   const [opsWallet, setOpsWallet] = useState('')
//   const [txStatus, setTxStatus] = useState({ loading: false, hash: null, error: null })
//   const [isOwner, setIsOwner] = useState(false)

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchAdminData = async () => {
//       if (!contracts || !account) return

//       try {
//         // Check if user is owner
//         const owner = await contracts.levelManager.owner()
//         setIsOwner(owner.toLowerCase() === account.toLowerCase())

//         // Get founder wallets
//         const wallets = await contracts.levelManager.getFounderWallets()
//         setFounderWallets(wallets[0])
//         setFounderRatios(wallets[1].map(r => r.toString()))

//         // Get current charge recipients
//         const nft = await contracts.levelManager.nftPool()
//         const ops = await contracts.levelManager.operationsWallet()
//         setNftPool(nft)
//         setOpsWallet(ops)

//       } catch (err) {
//         console.error('Error fetching admin data:', err)
//       }
//     }

//     fetchAdminData()
//   }, [contracts, account])

//   const handleAddFounderWallet = async () => {
//     if (!newWallet) return
    
//     const newWallets = [...founderWallets, newWallet]
//     const newRatios = [...founderRatios, newRatio]
    
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.levelManager.setFounderWallets(newWallets, newRatios)
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
      
//       setFounderWallets(newWallets)
//       setFounderRatios(newRatios)
//       setNewWallet('')
//       setNewRatio('1250')
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   const handleAddFounderRep = async () => {
//     if (!repAddress) return
    
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.levelManager.setFounderRepresentatives([repAddress])
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
      
//       setRepAddress('')
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   const handleUpdateChargeRecipients = async () => {
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.levelManager.updateChargeRecipients(nftPool, opsWallet)
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   if (!isConnected) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="info">
//           Please connect your wallet to access admin panel
//         </Alert>
//       </Container>
//     )
//   }

//   if (!isOwner) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="danger">
//           You are not the contract owner. Admin access restricted.
//         </Alert>
//       </Container>
//     )
//   }

//   if (isLoading) {
//     return (
//       <Container className="mt-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading admin data...</p>
//       </Container>
//     )
//   }

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Admin Panel</h1>

//       {txStatus.error && (
//         <Alert variant="danger" className="mb-3" dismissible>
//           {txStatus.error}
//         </Alert>
//       )}

//       {txStatus.hash && (
//         <Alert variant="info" className="mb-3">
//           Transaction: <a 
//             href={`https://amoy.polygonscan.com/tx/${txStatus.hash}`}
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             {txStatus.hash.slice(0, 10)}...{txStatus.hash.slice(-8)}
//           </a>
//         </Alert>
//       )}

//       <Row>
//         <Col md={6}>
//           <Card className="mb-4">
//             <Card.Header as="h5">Founder Wallets</Card.Header>
//             <Card.Body>
//               <Table striped bordered hover size="sm">
//                 <thead>
//                   <tr>
//                     <th>Wallet Address</th>
//                     <th>Ratio</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {founderWallets.map((wallet, index) => (
//                     <tr key={index}>
//                       <td>{wallet.slice(0, 6)}...{wallet.slice(-4)}</td>
//                       <td>{(parseInt(founderRatios[index]) / 100).toFixed(2)}%</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>

//               <h6 className="mt-3">Add New Founder Wallet</h6>
//               <Form.Group className="mb-2">
//                 <Form.Label>Wallet Address</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="0x..."
//                   value={newWallet}
//                   onChange={(e) => setNewWallet(e.target.value)}
//                 />
//               </Form.Group>
//               <Form.Group className="mb-2">
//                 <Form.Label>Ratio (1-10000, default 1250 = 12.5%)</Form.Label>
//                 <Form.Control
//                   type="number"
//                   value={newRatio}
//                   onChange={(e) => setNewRatio(e.target.value)}
//                 />
//               </Form.Group>
//               <Button
//                 variant="primary"
//                 onClick={handleAddFounderWallet}
//                 disabled={txStatus.loading || !newWallet}
//               >
//                 Add Founder Wallet
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>

//         <Col md={6}>
//           <Card className="mb-4">
//             <Card.Header as="h5">Founder Representatives</Card.Header>
//             <Card.Body>
//               <Form.Group className="mb-3">
//                 <Form.Label>Representative Address</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="0x..."
//                   value={repAddress}
//                   onChange={(e) => setRepAddress(e.target.value)}
//                 />
//               </Form.Group>
//               <Button
//                 variant="primary"
//                 onClick={handleAddFounderRep}
//                 disabled={txStatus.loading || !repAddress}
//               >
//                 Add Founder Representative
//               </Button>
//             </Card.Body>
//           </Card>

//           <Card className="mb-4">
//             <Card.Header as="h5">Charge Recipients</Card.Header>
//             <Card.Body>
//               <Form.Group className="mb-2">
//                 <Form.Label>NFT Pool Address</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="0x..."
//                   value={nftPool}
//                   onChange={(e) => setNftPool(e.target.value)}
//                 />
//               </Form.Group>
//               <Form.Group className="mb-2">
//                 <Form.Label>Operations Wallet Address</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="0x..."
//                   value={opsWallet}
//                   onChange={(e) => setOpsWallet(e.target.value)}
//                 />
//               </Form.Group>
//               <Button
//                 variant="primary"
//                 onClick={handleUpdateChargeRecipients}
//                 disabled={txStatus.loading}
//               >
//                 Update Recipients
//               </Button>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   )
// }