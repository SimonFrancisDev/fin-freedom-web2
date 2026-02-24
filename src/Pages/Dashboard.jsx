import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { CONTRACT_ADDRESSES } from '../constants/addresses'
import { ethers } from 'ethers'

export const Dashboard = () => {
  const { isConnected, account } = useWallet()
  const { contracts, isLoading, error, loadContracts } = useContracts()
  const [contractBalances, setContractBalances] = useState({})
  const [userLevels, setUserLevels] = useState({})
  const [networkWarning, setNetworkWarning] = useState('')

  const dashboardStyles = `
    body {
      background-color: #f0f4f8;
      font-family: 'Inter', sans-serif;
    }

    /* Hospital Pulse / ECG Animation */
    @keyframes pulse-line {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    @keyframes radar-pulse {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }

    @keyframes scroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .animate-fade { animation: fadeInUp 0.6s ease-out forwards; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* The "Hospital Wave" Background for cards */
    .pulse-bg {
      background-image: linear-gradient(90deg, transparent 0%, rgba(0, 35, 102, 0.05) 45%, rgba(0, 68, 204, 0.2) 50%, rgba(0, 35, 102, 0.05) 55%, transparent 100%);
      background-size: 200% 100%;
      animation: pulse-line 3s linear infinite;
    }

    .royal-card {
      min-width: 280px;
      margin: 0 15px;
      border: 1px solid rgba(0, 35, 102, 0.1);
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(0, 35, 102, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .level-active {
      background: linear-gradient(135deg, #002366 0%, #0044cc 100%);
      color: white !important;
      border: none;
      box-shadow: 0 0 20px rgba(0, 68, 204, 0.4);
    }

    .level-active .pulse-bg {
      background-image: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0) 45%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 255, 255, 0) 55%, transparent 100%);
    }

    .section-title {
      color: #002366;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 1.1rem;
      border-left: 5px solid #002366;
      padding-left: 15px;
    }

    .radar-dot {
      width: 10px;
      height: 10px;
      background-color: #00ffcc;
      border-radius: 50%;
      position: relative;
      display: inline-block;
    }

    .radar-dot::before {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #00ffcc;
      border-radius: 50%;
      animation: radar-pulse 2s infinite;
    }

    .slider-container {
      overflow: hidden;
      padding: 30px 0;
      mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    }
    
    .slider-track {
      display: flex;
      width: fit-content;
      animation: scroll 40s linear infinite;
    }
  `;

  useEffect(() => {
    const checkNetwork = async () => {
      if (!window.ethereum) return
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0x13882') {
        setNetworkWarning('Protocol Mismatch: Switch to Polygon Amoy Core')
      } else {
        setNetworkWarning('')
      }
    }
    checkNetwork()
    const handleChainChanged = () => { window.location.reload() }
    window.ethereum?.on('chainChanged', handleChainChanged)
    return () => { window.ethereum?.removeListener('chainChanged', handleChainChanged) }
  }, [])

  useEffect(() => {
    if (isConnected) { loadContracts() }
  }, [isConnected])

  useEffect(() => {
    const fetchData = async () => {
      if (!contracts || !account) return
      try {
        const balances = {}
        for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
          if (name !== 'USDT') {
            const balance = await contracts.usdt.balanceOf(address)
            balances[name] = ethers.formatUnits(balance, 6)
          }
        }
        setContractBalances(balances)
        const levels = {}
        for (let i = 1; i <= 10; i++) {
          const activated = await contracts.registration.levelActivated(account, i)
          levels[`level${i}`] = activated
        }
        setUserLevels(levels)
      } catch (err) {
        console.error('Cryptographic sync error:', err)
      }
    }
    fetchData()
  }, [contracts, account])

  if (!isConnected) {
    return (
      <Container className="mt-5 pt-5 animate-fade text-center">
        <div className="p-5 rounded-4 shadow-lg bg-white">
          <div className="radar-dot mb-3" style={{backgroundColor: '#ff4d4d'}}></div>
          <h2 style={{ color: '#002366', fontWeight: '800' }}>CRYPTOGRAPHIC HANDSHAKE REQUIRED</h2>
          <p className="text-muted">Awaiting secure peer-to-peer connection to authorize node entry.</p>
        </div>
      </Container>
    )
  }

  const levelsRange = Array.from({ length: 10 }, (_, i) => i + 1);
  const scrollItems = [...levelsRange, ...levelsRange];

  return (
    <Container className="mt-5 pt-5 pb-5">
      <style>{dashboardStyles}</style>
      
      <div className="animate-fade">
        {/* Lab Center Header */}
        <div className="mb-5 p-4 rounded-4 shadow-sm bg-white d-flex justify-content-between align-items-center">
            <div>
                <h1 className="section-title m-0">Protocol Secure Terminal</h1>
                <div className="d-flex align-items-center mt-2 ms-3">
                  <div className="radar-dot me-2"></div>
                  <span className="text-muted small fw-bold" style={{fontFamily: 'monospace'}}>
                    NODE_AUTH: {account.substring(0,12)}...SECURE_LINK
                  </span>
                </div>
            </div>
            <div className="text-end d-none d-md-block">
                <div className="small fw-bold text-uppercase text-muted">Ledger Sync</div>
                <div className="text-primary fw-bold" style={{fontSize: '0.8rem'}}>ENCRYPTED_UPSTREAM</div>
            </div>
        </div>

        {/* Level Matrix */}
        <h2 className="section-title mb-4">Chain Level Matrix [L1-L10]</h2>
        <div className="slider-container mb-5">
          <div className="slider-track">
            {scrollItems.map((level, index) => {
              const isActive = userLevels[`level${level}`];
              return (
                <div key={index} className={`royal-card ${isActive ? 'level-active' : ''}`}>
                  <div className="pulse-bg p-4 text-center h-100 w-100">
                    <div className="small text-uppercase opacity-75 mb-1" style={{ letterSpacing: '2px', fontSize: '0.6rem' }}>Level Validation Layer</div>
                    <h3 className="fw-bold mb-3" style={{ fontSize: '1.6rem', fontFamily: 'monospace' }}>Level_{level.toString().padStart(2, '0')}</h3>
                    <div className={`py-1 px-3 rounded-pill d-inline-block ${isActive ? 'bg-white text-primary' : 'bg-light text-muted'}`} style={{ fontSize: '0.6rem', fontWeight: '900' }}>
                      {isActive ? '● Level_Activated' : '○ Level_Not_Active'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Balances */}
        <h2 className="section-title mb-4">Treasury Summary</h2>
        <Row>
          {Object.entries(contractBalances).map(([name, balance]) => (
            <Col lg={4} md={6} key={name} className="mb-4">
              <div className="royal-card h-100">
                <div className="pulse-bg p-4 h-100 w-100">
                  <div className="d-flex justify-content-between align-items-center border-bottom border-light pb-2 mb-3">
                    <span className="text-uppercase small fw-bold text-muted" style={{letterSpacing: '1px'}}>{name.replace(/_/g, ' ')}</span>
                    <span className="badge rounded-pill bg-primary" style={{fontSize: '0.6rem'}}>Real Data</span>
                  </div>
                  <h2 className="fw-bold m-0" style={{ color: '#002366', fontFamily: 'monospace' }}>
                    {parseFloat(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </h2>
                  <div className="small fw-bold text-muted mt-1">USDT_SYNCHRONIZED</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  )
}






// import React, { useEffect, useState } from 'react'
// import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap'
// import { useWallet } from '../hooks/useWallet'
// import { useContracts } from '../hooks/useContracts'
// import { CONTRACT_ADDRESSES } from '../constants/addresses'
// import { ethers } from 'ethers'

// export const Dashboard = () => {
//   const { isConnected, account } = useWallet()
//   const { contracts, isLoading, error, loadContracts } = useContracts()
//   const [contractBalances, setContractBalances] = useState({})
//   const [userLevels, setUserLevels] = useState({})
//   const [networkWarning, setNetworkWarning] = useState('')

//   useEffect(() => {
//     const checkNetwork = async () => {
//       if (!window.ethereum) return
      
//       const chainId = await window.ethereum.request({ method: 'eth_chainId' })
//       console.log('Current chain ID:', chainId)
      
//       // FIXED: Changed from 0x13881 to 0x13882
//       if (chainId !== '0x13882') {
//         setNetworkWarning('Please switch to Polygon Amoy Testnet')
//       } else {
//         setNetworkWarning('')
//       }
//     }
    
//     checkNetwork()
    
//     // ADDED: Listen for chain changes
//     const handleChainChanged = () => {
//       window.location.reload()
//     }
    
//     window.ethereum?.on('chainChanged', handleChainChanged)
    
//     return () => {
//       window.ethereum?.removeListener('chainChanged', handleChainChanged)
//     }
//   }, [])

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!contracts || !account) return

//       try {
//         // Get contract balances
//         const balances = {}
//         for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
//           if (name !== 'USDT') {
//             const balance = await contracts.usdt.balanceOf(address)
//             balances[name] = ethers.formatUnits(balance, 6)
//           }
//         }
//         setContractBalances(balances)

//         // Get user levels - FIXED: Use levelActivated mapping instead of isLevelActivated
//         const levels = {}
//         for (let i = 1; i <= 3; i++) {
//           // CHANGED: contracts.registration.isLevelActivated → contracts.registration.levelActivated
//           const activated = await contracts.registration.levelActivated(account, i)
//           levels[`level${i}`] = activated
//         }
//         setUserLevels(levels)
//       } catch (err) {
//         console.error('Error fetching data:', err)
//       }
//     }

//     fetchData()
//   }, [contracts, account])

//   if (!isConnected) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="info">
//           Please connect your wallet to view the dashboard
//         </Alert>
//       </Container>
//     )
//   }

//   if (networkWarning) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="warning">
//           ⚠️ {networkWarning}
//         </Alert>
//       </Container>
//     )
//   }

//   if (isLoading) {
//     return (
//       <Container className="mt-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading contracts...</p>
//       </Container>
//     )
//   }

//   if (error) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="danger">
//           Error: {error}
//         </Alert>
//       </Container>
//     )
//   }

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Freedom Protocol Dashboard</h1>
      
//       <Row className="mb-4">
//         <Col>
//           <Card>
//             <Card.Body>
//               <Card.Title>Connected Account</Card.Title>
//               <Card.Text>
//                 <strong>Address:</strong> {account}
//               </Card.Text>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>

//       <Row className="mb-4">
//         <Col>
//           <h2>Your Levels</h2>
//           <Row>
//             {[1, 2, 3].map((level) => (
//               <Col md={4} key={level}>
//                 <Card className="mb-3">
//                   <Card.Body>
//                     <Card.Title>Level {level}</Card.Title>
//                     <Card.Text>
//                       Status: {' '}
//                       {userLevels[`level${level}`] ? (
//                         <span className="text-success">Activated ✓</span>
//                       ) : (
//                         <span className="text-warning">Not Activated</span>
//                       )}
//                     </Card.Text>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         </Col>
//       </Row>

//       <Row>
//         <Col>
//           <h2>Contract Balances (USDT)</h2>
//           <Row>
//             {Object.entries(contractBalances).map(([name, balance]) => (
//               <Col md={4} key={name}>
//                 <Card className="mb-3">
//                   <Card.Body>
//                     <Card.Title>{name.replace(/_/g, ' ')}</Card.Title>
//                     <Card.Text>
//                       <strong>{balance} USDT</strong>
//                     </Card.Text>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         </Col>
//       </Row>
//     </Container>
//   )
// }