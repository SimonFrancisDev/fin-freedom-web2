import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner, ProgressBar } from 'react-bootstrap'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { ethers } from 'ethers'

export const Orbits = () => {
  const { isConnected, account } = useWallet()
  const { contracts, isLoading, error, loadContracts } = useContracts()
  
  const [p4Data, setP4Data] = useState({ currentPosition: 0, positions: [] })
  const [p12Data, setP12Data] = useState({ currentIndex: 0, positions: [] })
  const [p39Data, setP39Data] = useState({ currentIndex: 0, positions: [] })
  const [userLocks, setUserLocks] = useState({ p4: '0', p12: '0', p39: '0' })
  const [orbitError, setOrbitError] = useState('')

  // CYBER-ORBIT STYLES
  const orbitStyles = `
    @keyframes pulse-line {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes orbit-glow {
      0%, 100% { border-color: rgba(0, 68, 204, 0.2); }
      50% { border-color: rgba(0, 68, 204, 0.6); }
    }
    .lab-card {
      background: white;
      border: 1px solid rgba(0, 35, 102, 0.1);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 35, 102, 0.05);
      overflow: hidden;
    }
    .orbit-header {
      background: #002366;
      color: white;
      font-family: 'monospace';
      font-size: 0.85rem;
      padding: 10px 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .docking-station {
      font-family: 'monospace';
      font-weight: 700;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid #eee;
    }
    .station-filled {
      background: linear-gradient(135deg, #002366 0%, #0044cc 100%);
      color: white !important;
      border: none;
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 68, 204, 0.3);
    }
    .energy-cell .progress {
      height: 12px;
      background: #f0f4f8;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #eee;
    }
    .pulse-overlay {
      background-image: linear-gradient(90deg, transparent 0%, rgba(0, 35, 102, 0.02) 45%, rgba(0, 68, 204, 0.08) 50%, rgba(0, 35, 102, 0.02) 55%, transparent 100%);
      background-size: 200% 100%;
      animation: pulse-line 5s linear infinite;
    }
    .nav-tabs .nav-link {
      border: none;
      color: #666;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 1px;
      padding: 15px 25px;
    }
    .nav-tabs .nav-link.active {
      color: #002366;
      border-bottom: 3px solid #002366;
      background: transparent;
    }
  `;

  useEffect(() => {
    if (isConnected) { loadContracts() }
  }, [isConnected])

  useEffect(() => {
    const fetchOrbitData = async () => {
      if (!contracts || !account) return
      setOrbitError('') 
      try {
        if (contracts.p4Orbit) {
          const p4Position = await contracts.p4Orbit.currentPosition()
          const p4Locked = await contracts.escrow.getLockedAmount(account, 1, 2)
          setP4Data({
            currentPosition: Number(p4Position),
            positions: Array(4).fill().map((_, i) => ({ filled: i < Number(p4Position) }))
          })
          setUserLocks(prev => ({ ...prev, p4: ethers.formatUnits(p4Locked, 6) }))
        }
        if (contracts.p12Orbit) {
          const p12Index = await contracts.p12Orbit.currentIndex()
          const p12Locked = await contracts.escrow.getLockedAmount(account, 2, 3)
          setP12Data({
            currentIndex: Number(p12Index),
            positions: Array(12).fill().map((_, i) => ({ filled: i < Number(p12Index) }))
          })
          setUserLocks(prev => ({ ...prev, p12: ethers.formatUnits(p12Locked, 6) }))
        }
        if (contracts.p39Orbit) {
          const p39Index = await contracts.p39Orbit.currentIndex()
          const p39Locked = await contracts.escrow.getLockedAmount(account, 3, 4)
          setP39Data({
            currentIndex: Number(p39Index),
            positions: Array(39).fill().map((_, i) => ({ filled: i < Number(p39Index) }))
          })
          setUserLocks(prev => ({ ...prev, p39: ethers.formatUnits(p39Locked, 6) }))
        }
      } catch (err) {
        console.error('Orbit sync error:', err)
        setOrbitError('Protocol Sync Failure: Telemetry data corrupted.')
      }
    }
    fetchOrbitData()
  }, [contracts, account])

  if (!isConnected) {
    return (
      <Container className="mt-5 pt-5">
        <Alert variant="primary" className="text-center p-5 lab-card shadow-lg" style={{backgroundColor: '#002366', color: 'white', border: 'none'}}>
          <h4 className="fw-bold">AWAITING TERMINAL CONNECTION</h4>
          <p className="m-0 opacity-75">Establish a secure wallet uplink to view Orbital trajectories.</p>
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 fw-bold text-muted" style={{letterSpacing: '2px'}}>SYNCHRONIZING_ORBITS...</p>
      </Container>
    )
  }

  if (orbitError) {
    return (
      <Container className="mt-5">
        <Alert variant="danger" className="lab-card shadow-sm border-0">
          <strong className="text-danger">SYSTEM_ALERT:</strong> {orbitError}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="mt-5 pt-4">
      <style>{orbitStyles}</style>
      
      <div className="d-flex align-items-center mt-5 mb-4">
        <div style={{height: '35px', width: '8px', background: '#002366', marginRight: '15px'}}></div>
        <h1 className="m-0 fw-black text-uppercase" style={{color: '#002366', letterSpacing: '2px', fontSize: '2rem'}}>Orbits Terminal</h1>
      </div>
      
      <Alert variant="info" className="mb-5 border-0 shadow-sm p-4" style={{borderRadius: '15px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)'}}>
        <strong className="text-primary text-uppercase" style={{fontSize: '0.8rem'}}>System Protocol Note:</strong> 
        <p className="m-0 small mt-1 text-muted">All the Levels 1-10 maintain active Payout Orbits. and they also operate as passive status nodes accessible via the automated upgrade sequence.</p>
      </Alert>

      <Tabs defaultActiveKey="p4" className="mb-4 border-0">
        {/* P4 ORBIT TAB */}
        <Tab eventKey="p4" title="P4_TRAJECTORY (L1)">
          <Row className="animate-fade">
            <Col lg={8}>
              <div className="lab-card mb-4">
                <div className="orbit-header">Orbital Docking Status</div>
                <div className="p-4 pulse-overlay">
                  <div className="d-flex justify-content-between align-items-end mb-4">
                    <h5 className="m-0 fw-bold">Current Occupancy</h5>
                    <span className="badge bg-light text-primary border">{p4Data.currentPosition} / 4 UNITS</span>
                  </div>
                  <div className="d-flex gap-3 flex-wrap">
                    {p4Data.positions.map((pos, i) => (
                      <div key={i} className={`p-4 docking-station rounded-4 d-flex flex-column align-items-center justify-content-center ${pos.filled ? 'station-filled' : 'bg-light text-muted'}`} style={{ minWidth: '100px', flex: '1' }}>
                        <span style={{fontSize: '0.6rem'}} className="opacity-75">DOCK_</span>
                        <span style={{fontSize: '1.2rem'}}>0{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={4}>
              <div className="lab-card energy-cell h-100">
                <div className="orbit-header">Vault Accumulation</div>
                <div className="p-4 pulse-overlay">
                  <div className="small fw-bold text-muted text-uppercase mb-2">Escrow Lockup Status</div>
                  <h3 className="fw-black mb-3" style={{color: '#002366', fontFamily: 'monospace'}}>{userLocks.p4} <span className="small text-muted">/ 20 USDT</span></h3>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p4) / 20) * 100} 
                    variant="primary"
                    className="mb-3"
                  />
                  <div className="p-3 bg-light rounded-3 small fw-bold text-center">
                    {parseFloat(userLocks.p4) >= 20 
                      ? '✅ CORE_READY: UPLINK TO L2 AVAILABLE' 
                      : `PENDING: ${(20 - parseFloat(userLocks.p4)).toFixed(1)} USDT TO SYNC`}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Tab>

        {/* P12 ORBIT TAB */}
        <Tab eventKey="p12" title="P12_TRAJECTORY (L2)">
          <Row>
            <Col lg={8}>
              <div className="lab-card mb-4">
                <div className="orbit-header">Orbital Docking Status</div>
                <div className="p-4 pulse-overlay">
                  <div className="d-flex justify-content-between align-items-end mb-4">
                    <h5 className="m-0 fw-bold">Current Occupancy</h5>
                    <span className="badge bg-light text-primary border">{p12Data.currentIndex} / 12 UNITS</span>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {p12Data.positions.map((pos, i) => (
                      <div key={i} className={`p-3 docking-station rounded-3 text-center ${pos.filled ? 'station-filled' : 'bg-light text-muted'}`} style={{ width: '65px' }}>
                        <div style={{fontSize: '0.6rem'}} className="opacity-75">ST_</div>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={4}>
              <div className="lab-card energy-cell h-100">
                <div className="orbit-header">Vault Accumulation</div>
                <div className="p-4 pulse-overlay">
                  <div className="small fw-bold text-muted text-uppercase mb-2">Escrow Lockup Status</div>
                  <h3 className="fw-black mb-3" style={{color: '#002366', fontFamily: 'monospace'}}>{userLocks.p12} <span className="small text-muted">/ 40 USDT</span></h3>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p12) / 40) * 100} 
                    variant="primary"
                    className="mb-3"
                  />
                  <div className="p-3 bg-light rounded-3 small fw-bold text-center">
                    {parseFloat(userLocks.p12) >= 40 
                      ? '✅ CORE_READY: UPLINK TO L3 AVAILABLE' 
                      : `PENDING: ${(40 - parseFloat(userLocks.p12)).toFixed(1)} USDT TO SYNC`}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Tab>

        {/* P39 ORBIT TAB */}
        <Tab eventKey="p39" title="P39_TRAJECTORY (L3)">
          <Row>
            <Col lg={8}>
              <div className="lab-card mb-4">
                <div className="orbit-header">Orbital Docking Status</div>
                <div className="p-4 pulse-overlay">
                  <div className="d-flex justify-content-between align-items-end mb-4">
                    <h5 className="m-0 fw-bold">Current Occupancy</h5>
                    <span className="badge bg-light text-primary border">{p39Data.currentIndex} / 39 UNITS</span>
                  </div>
                  <div className="d-flex gap-1 flex-wrap">
                    {p39Data.positions.map((pos, i) => (
                      <div key={i} className={`docking-station rounded-2 text-center d-flex align-items-center justify-content-center ${pos.filled ? 'station-filled' : 'bg-light text-muted'}`} style={{ width: '32px', height: '32px', fontSize: '10px' }}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Col>
            <Col lg={4}>
              <div className="lab-card energy-cell h-100">
                <div className="orbit-header">Vault Accumulation</div>
                <div className="p-4 pulse-overlay">
                  <div className="small fw-bold text-muted text-uppercase mb-2">Escrow Lockup Status</div>
                  <h3 className="fw-black mb-3" style={{color: '#002366', fontFamily: 'monospace'}}>{userLocks.p39} <span className="small text-muted">/ 80 USDT</span></h3>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p39) / 80) * 100} 
                    variant="primary"
                    className="mb-3"
                  />
                  <div className="p-3 bg-light rounded-3 small fw-bold text-center">
                    {parseFloat(userLocks.p39) >= 80 
                      ? '✅ CORE_READY: UPLINK TO L4 AVAILABLE' 
                      : `PENDING: ${(80 - parseFloat(userLocks.p39)).toFixed(1)} USDT TO SYNC`}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  )
}











// import React, { useState, useEffect } from 'react'
// import { Container, Row, Col, Card, Tabs, Tab, Alert, Spinner, ProgressBar } from 'react-bootstrap'
// import { useWallet } from '../hooks/useWallet'
// import { useContracts } from '../hooks/useContracts'
// import { ethers } from 'ethers'

// export const Orbits = () => {
//   const { isConnected, account } = useWallet()
//   const { contracts, isLoading, error, loadContracts } = useContracts()
  
//   const [p4Data, setP4Data] = useState({ currentPosition: 0, positions: [] })
//   const [p12Data, setP12Data] = useState({ currentIndex: 0, positions: [] })
//   const [p39Data, setP39Data] = useState({ currentIndex: 0, positions: [] })
//   const [userLocks, setUserLocks] = useState({ p4: '0', p12: '0', p39: '0' })
//   const [orbitError, setOrbitError] = useState('') // ADDED: Error state

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchOrbitData = async () => {
//       if (!contracts || !account) return

//       setOrbitError('') // Reset error
      
//       try {
//         // P4 Orbit data - ADDED: Null checks
//         if (contracts.p4Orbit) {
//           const p4Position = await contracts.p4Orbit.currentPosition()
//           const p4Locked = await contracts.escrow.getLockedAmount(account, 1, 2)
          
//           setP4Data({
//             currentPosition: Number(p4Position),
//             positions: Array(4).fill().map((_, i) => ({
//               filled: i < Number(p4Position)
//             }))
//           })
          
//           setUserLocks(prev => ({ ...prev, p4: ethers.formatUnits(p4Locked, 6) }))
//         }
        
//         // P12 Orbit data - ADDED: Null checks
//         if (contracts.p12Orbit) {
//           const p12Index = await contracts.p12Orbit.currentIndex()
//           const p12Locked = await contracts.escrow.getLockedAmount(account, 2, 3)
          
//           setP12Data({
//             currentIndex: Number(p12Index),
//             positions: Array(12).fill().map((_, i) => ({
//               filled: i < Number(p12Index)
//             }))
//           })
          
//           setUserLocks(prev => ({ ...prev, p12: ethers.formatUnits(p12Locked, 6) }))
//         }
        
//         // P39 Orbit data - ADDED: Null checks
//         if (contracts.p39Orbit) {
//           const p39Index = await contracts.p39Orbit.currentIndex()
//           const p39Locked = await contracts.escrow.getLockedAmount(account, 3, 4)
          
//           setP39Data({
//             currentIndex: Number(p39Index),
//             positions: Array(39).fill().map((_, i) => ({
//               filled: i < Number(p39Index)
//             }))
//           })
          
//           setUserLocks(prev => ({ ...prev, p39: ethers.formatUnits(p39Locked, 6) }))
//         }

//       } catch (err) {
//         console.error('Error fetching orbit data:', err)
//         setOrbitError('Failed to load orbit data. Please try refreshing.')
//       }
//     }

//     fetchOrbitData()
//   }, [contracts, account])

//   if (!isConnected) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="info">
//           Please connect your wallet to view orbit data
//         </Alert>
//       </Container>
//     )
//   }

//   if (isLoading) {
//     return (
//       <Container className="mt-5 text-center">
//         <Spinner animation="border" variant="primary" />
//         <p className="mt-2">Loading orbit data...</p>
//       </Container>
//     )
//   }

//   // ADDED: Error display
//   if (orbitError) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="warning">
//           {orbitError}
//         </Alert>
//       </Container>
//     )
//   }

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Orbits Dashboard</h1>
      
//       {/* ADDED: Explanation for only 3 orbits */}
//       <Alert variant="info" className="mb-4">
//         <strong>Note:</strong> Only Levels 1-3 have active orbits with payout mechanisms. 
//         Levels 4-10 are status-only levels that you can reach through auto-upgrade, but they don't have separate orbits.
//       </Alert>

//       <Tabs defaultActiveKey="p4" className="mb-3">
//         <Tab eventKey="p4" title="P4 Orbit (Level 1)">
//           <Row>
//             <Col md={8}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Orbit Status</Card.Header>
//                 <Card.Body>
//                   <p><strong>Current Position:</strong> {p4Data.currentPosition} / 4</p>
//                   <div className="d-flex gap-2 flex-wrap">
//                     {p4Data.positions.map((pos, i) => (
//                       <div
//                         key={i}
//                         className={`p-3 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
//                         style={{ width: '80px', textAlign: 'center' }}
//                       >
//                         Pos {i + 1}
//                       </div>
//                     ))}
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//             <Col md={4}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
//                 <Card.Body>
//                   <p><strong>Locked:</strong> {userLocks.p4} / 20 USDT</p>
//                   <ProgressBar 
//                     now={(parseFloat(userLocks.p4) / 20) * 100} 
//                     label={`${((parseFloat(userLocks.p4) / 20) * 100).toFixed(1)}%`}
//                     variant="success"
//                   />
//                   <p className="mt-2 text-muted">
//                     {parseFloat(userLocks.p4) >= 20 
//                       ? '✅ Ready to auto-upgrade to Level 2!' 
//                       : `Need ${(20 - parseFloat(userLocks.p4)).toFixed(1)} more USDT`}
//                   </p>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </Tab>

//         <Tab eventKey="p12" title="P12 Orbit (Level 2)">
//           <Row>
//             <Col md={8}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Orbit Status</Card.Header>
//                 <Card.Body>
//                   <p><strong>Current Position:</strong> {p12Data.currentIndex} / 12</p>
//                   <div className="d-flex gap-2 flex-wrap">
//                     {p12Data.positions.map((pos, i) => (
//                       <div
//                         key={i}
//                         className={`p-2 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
//                         style={{ width: '60px', textAlign: 'center' }}
//                       >
//                         {i + 1}
//                       </div>
//                     ))}
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//             <Col md={4}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
//                 <Card.Body>
//                   <p><strong>Locked:</strong> {userLocks.p12} / 40 USDT</p>
//                   <ProgressBar 
//                     now={(parseFloat(userLocks.p12) / 40) * 100} 
//                     label={`${((parseFloat(userLocks.p12) / 40) * 100).toFixed(1)}%`}
//                     variant="success"
//                   />
//                   <p className="mt-2 text-muted">
//                     {parseFloat(userLocks.p12) >= 40 
//                       ? '✅ Ready to auto-upgrade to Level 3!' 
//                       : `Need ${(40 - parseFloat(userLocks.p12)).toFixed(1)} more USDT`}
//                   </p>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </Tab>

//         <Tab eventKey="p39" title="P39 Orbit (Level 3)">
//           <Row>
//             <Col md={8}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Orbit Status</Card.Header>
//                 <Card.Body>
//                   <p><strong>Current Position:</strong> {p39Data.currentIndex} / 39</p>
//                   <div className="d-flex gap-1 flex-wrap">
//                     {p39Data.positions.map((pos, i) => (
//                       <div
//                         key={i}
//                         className={`p-1 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
//                         style={{ width: '35px', textAlign: 'center', fontSize: '12px' }}
//                       >
//                         {i + 1}
//                       </div>
//                     ))}
//                   </div>
//                 </Card.Body>
//               </Card>
//             </Col>
//             <Col md={4}>
//               <Card className="mb-3">
//                 <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
//                 <Card.Body>
//                   <p><strong>Locked:</strong> {userLocks.p39} / 80 USDT</p>
//                   <ProgressBar 
//                     now={(parseFloat(userLocks.p39) / 80) * 100} 
//                     label={`${((parseFloat(userLocks.p39) / 80) * 100).toFixed(1)}%`}
//                     variant="success"
//                   />
//                   <p className="mt-2 text-muted">
//                     {parseFloat(userLocks.p39) >= 80 
//                       ? '✅ Ready to auto-upgrade to Level 4!' 
//                       : `Need ${(80 - parseFloat(userLocks.p39)).toFixed(1)} more USDT`}
//                   </p>
//                 </Card.Body>
//               </Card>
//             </Col>
//           </Row>
//         </Tab>
//       </Tabs>
//     </Container>
//   )
// }
