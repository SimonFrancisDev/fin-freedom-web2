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

  // LAB GOVERNANCE STYLES
  const founderStyles = `
    @keyframes pulse-line {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    .lab-terminal {
      background: white;
      border: 1px solid rgba(0, 35, 102, 0.1);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 35, 102, 0.05);
      overflow: hidden;
    }
    .terminal-header {
      background: #002366;
      color: white;
      font-family: 'monospace';
      font-size: 0.85rem;
      padding: 12px 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
      border-bottom: 3px solid #0044cc;
    }
    .pulse-overlay {
      background-image: linear-gradient(90deg, transparent 0%, rgba(0, 35, 102, 0.02) 45%, rgba(0, 68, 204, 0.08) 50%, rgba(0, 35, 102, 0.02) 55%, transparent 100%);
      background-size: 200% 100%;
      animation: pulse-line 4s linear infinite;
    }
    .data-table {
      border: none;
      margin-bottom: 0;
    }
    .data-table thead th {
      background: #f8fafd;
      color: #002366;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-top: none;
      padding: 15px;
    }
    .data-table tbody td {
      padding: 15px;
      vertical-align: middle;
      font-family: 'monospace';
      font-size: 0.9rem;
      border-color: #f0f4f8;
    }
    .status-badge {
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 1px;
    }
    .id-check-row {
      border-left: 4px solid #002366;
      padding-left: 15px;
      margin-bottom: 10px;
    }
  `;

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchFounderData = async () => {
      if (!contracts || !account) return

      try {
        const wallets = await contracts.levelManager.getFounderWallets()
        setFounderWallets(wallets[0])
        setFounderRatios(wallets[1].map(r => r.toString()))

        const id1 = await contracts.levelManager.id1Wallet()
        setId1Wallet(id1)

        const isDownline = await contracts.levelManager.isID1Downline(account)
        setIsID1Downline(isDownline)

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
      <Container className="mt-5 pt-5">
        <Alert variant="primary" className="text-center p-5 lab-terminal" style={{backgroundColor: '#002366', color: 'white', border: 'none'}}>
          <h4 className="fw-bold">GOVERNANCE_HANDSHAKE_REQUIRED</h4>
          <p className="m-0 opacity-75">Connect secure uplink to synchronize Founder Ledger.</p>
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 fw-bold text-muted">EXTRACTING_LEDGER_DATA...</p>
      </Container>
    )
  }

  return (
    <Container className="mt-5 pt-4">
      <style>{founderStyles}</style>
      
      <div className="d-flex align-items-center mt-5 mb-4">
        <div style={{height: '35px', width: '8px', background: '#002366', marginRight: '15px'}}></div>
        <h1 className="m-0 fw-black text-uppercase" style={{color: '#002366', letterSpacing: '2px', fontSize: '2rem'}}>Founder Core</h1>
      </div>

      <Row className="mb-4">
        <Col>
          <div className="lab-terminal">
            <div className="terminal-header">[ Identification Stats ]</div>
            <div className="p-4 pulse-overlay">
              <Row>
                <Col md={6}>
                  <div className="id-check-row">
                    <div className="small text-muted text-uppercase fw-bold">Master_ID1_Terminal</div>
                    <div className="fw-bold" style={{fontFamily: 'monospace'}}>{id1Wallet || 'NULL_ADDRESS'}</div>
                  </div>
                  <div className="id-check-row">
                    <div className="small text-muted text-uppercase fw-bold">Active_Uplink_Node</div>
                    <div className="fw-bold" style={{fontFamily: 'monospace'}}>{account}</div>
                  </div>
                </Col>
                <Col md={6} className="d-flex align-items-center justify-content-md-end mt-3 mt-md-0">
                  <div className={`status-badge ${isID1Downline ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                    {isID1Downline ? '● ID1_DOWNLINE_SYNCED' : '○ NON_ID1_NODE'}
                  </div>
                </Col>
              </Row>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="lab-terminal">
            <div className="terminal-header">[ FOUNDER_VAULT_DISTRIBUTION ]</div>
            <div className="pulse-overlay">
              <Table responsive className="data-table">
                <thead>
                  <tr>
                    <th>Ledger_Address</th>
                    <th>Sharding_Ratio</th>
                    <th>Liquidity_Yield (USDT)</th>
                  </tr>
                </thead>
                <tbody>
                  {founderWallets.map((wallet, index) => (
                    <tr key={index}>
                      <td className="fw-bold">
                        <a 
                          href={`https://amoy.polygonscan.com/address/${wallet}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-decoration-none"
                        >
                          {wallet.slice(0, 12)}...{wallet.slice(-8)}
                        </a>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {(parseInt(founderRatios[index]) / 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="fw-bold text-success">
                        {walletBalances[wallet] || '0.00'} <small>USDT</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="p-3 border-top bg-light">
                <p className="text-muted m-0 small fw-bold">
                  <span className="text-primary">PROTOCOL_NOTE:</span> Each founder sharding node receives 1.125 USDT (12.5%) upon ID1-Downline validation of Tier_01 Activation.
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}



// import React, { useState, useEffect } from 'react'
// import { Container, Row, Col, Card, Table, Alert, Spinner } from 'react-bootstrap'
// import { useWallet } from '../hooks/useWallet'
// import { useContracts } from '../hooks/useContracts'
// import { ethers } from 'ethers'

// export const FounderPanel = () => {
//   const { isConnected, account } = useWallet()
//   const { contracts, isLoading, error, loadContracts } = useContracts()
  
//   const [founderWallets, setFounderWallets] = useState([])
//   const [founderRatios, setFounderRatios] = useState([])
//   const [walletBalances, setWalletBalances] = useState({})
//   const [id1Wallet, setId1Wallet] = useState('')
//   const [isID1Downline, setIsID1Downline] = useState(false)

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchFounderData = async () => {
//       if (!contracts || !account) return

//       try {
//         // Get founder wallets
//         const wallets = await contracts.levelManager.getFounderWallets()
//         setFounderWallets(wallets[0])
//         setFounderRatios(wallets[1].map(r => r.toString()))

//         // Get ID1 wallet
//         const id1 = await contracts.levelManager.id1Wallet()
//         setId1Wallet(id1)

//         // Check if current user is ID1 downline
//         const isDownline = await contracts.levelManager.isID1Downline(account)
//         setIsID1Downline(isDownline)

//         // Get balances for each founder wallet
//         const balances = {}
//         for (const wallet of wallets[0]) {
//           const balance = await contracts.usdt.balanceOf(wallet)
//           balances[wallet] = ethers.formatUnits(balance, 6)
//         }
//         setWalletBalances(balances)

//       } catch (err) {
//         console.error('Error fetching founder data:', err)
//       }
//     }

//     fetchFounderData()
//   }, [contracts, account])

//   if (!isConnected) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="info">
//           Please connect your wallet to view founder panel
//         </Alert>
//       </Container>
//     )
//   }

//   if (isLoading) {
//     return (
//       <Container className="mt-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading founder data...</p>
//       </Container>
//     )
//   }

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Founder Panel</h1>

//       <Row className="mb-4">
//         <Col>
//           <Card>
//             <Card.Body>
//               <Card.Title>ID1 Status</Card.Title>
//               <Card.Text>
//                 <strong>ID1 Wallet:</strong> {id1Wallet || 'Not set'}<br />
//                 <strong>Your Account:</strong> {account}<br />
//                 <strong>ID1 Downline:</strong> {isID1Downline ? '✅ Yes' : '❌ No'}
//               </Card.Text>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       <Row>
//         <Col>
//           <Card>
//             <Card.Header as="h5">Founder Wallets Distribution</Card.Header>
//             <Card.Body>
//               <Table striped bordered hover>
//                 <thead>
//                   <tr>
//                     <th>Wallet</th>
//                     <th>Ratio</th>
//                     <th>Current Balance (USDT)</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {founderWallets.map((wallet, index) => (
//                     <tr key={index}>
//                       <td>
//                         <a 
//                           href={`https://amoy.polygonscan.com/address/${wallet}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                         >
//                           {wallet.slice(0, 6)}...{wallet.slice(-4)}
//                         </a>
//                       </td>
//                       <td>{(parseInt(founderRatios[index]) / 100).toFixed(2)}%</td>
//                       <td>{walletBalances[wallet] || '0'} USDT</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </Table>
//               <p className="text-muted mt-2">
//                 Each founder receives 1.125 USDT (12.5%) when an ID1 downline activates Level 1
//               </p>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   )
// }