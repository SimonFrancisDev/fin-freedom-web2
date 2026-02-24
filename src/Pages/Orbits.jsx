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
  const [orbitError, setOrbitError] = useState('') // ADDED: Error state

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchOrbitData = async () => {
      if (!contracts || !account) return

      setOrbitError('') // Reset error
      
      try {
        // P4 Orbit data - ADDED: Null checks
        if (contracts.p4Orbit) {
          const p4Position = await contracts.p4Orbit.currentPosition()
          const p4Locked = await contracts.escrow.getLockedAmount(account, 1, 2)
          
          setP4Data({
            currentPosition: Number(p4Position),
            positions: Array(4).fill().map((_, i) => ({
              filled: i < Number(p4Position)
            }))
          })
          
          setUserLocks(prev => ({ ...prev, p4: ethers.formatUnits(p4Locked, 6) }))
        }
        
        // P12 Orbit data - ADDED: Null checks
        if (contracts.p12Orbit) {
          const p12Index = await contracts.p12Orbit.currentIndex()
          const p12Locked = await contracts.escrow.getLockedAmount(account, 2, 3)
          
          setP12Data({
            currentIndex: Number(p12Index),
            positions: Array(12).fill().map((_, i) => ({
              filled: i < Number(p12Index)
            }))
          })
          
          setUserLocks(prev => ({ ...prev, p12: ethers.formatUnits(p12Locked, 6) }))
        }
        
        // P39 Orbit data - ADDED: Null checks
        if (contracts.p39Orbit) {
          const p39Index = await contracts.p39Orbit.currentIndex()
          const p39Locked = await contracts.escrow.getLockedAmount(account, 3, 4)
          
          setP39Data({
            currentIndex: Number(p39Index),
            positions: Array(39).fill().map((_, i) => ({
              filled: i < Number(p39Index)
            }))
          })
          
          setUserLocks(prev => ({ ...prev, p39: ethers.formatUnits(p39Locked, 6) }))
        }

      } catch (err) {
        console.error('Error fetching orbit data:', err)
        setOrbitError('Failed to load orbit data. Please try refreshing.')
      }
    }

    fetchOrbitData()
  }, [contracts, account])

  if (!isConnected) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          Please connect your wallet to view orbit data
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading orbit data...</p>
      </Container>
    )
  }

  // ADDED: Error display
  if (orbitError) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          {orbitError}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Orbits Dashboard</h1>
      
      {/* ADDED: Explanation for only 3 orbits */}
      <Alert variant="info" className="mb-4">
        <strong>Note:</strong> Only Levels 1-3 have active orbits with payout mechanisms. 
        Levels 4-10 are status-only levels that you can reach through auto-upgrade, but they don't have separate orbits.
      </Alert>

      <Tabs defaultActiveKey="p4" className="mb-3">
        <Tab eventKey="p4" title="P4 Orbit (Level 1)">
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Header as="h5">Orbit Status</Card.Header>
                <Card.Body>
                  <p><strong>Current Position:</strong> {p4Data.currentPosition} / 4</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {p4Data.positions.map((pos, i) => (
                      <div
                        key={i}
                        className={`p-3 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
                        style={{ width: '80px', textAlign: 'center' }}
                      >
                        Pos {i + 1}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
                <Card.Body>
                  <p><strong>Locked:</strong> {userLocks.p4} / 20 USDT</p>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p4) / 20) * 100} 
                    label={`${((parseFloat(userLocks.p4) / 20) * 100).toFixed(1)}%`}
                    variant="success"
                  />
                  <p className="mt-2 text-muted">
                    {parseFloat(userLocks.p4) >= 20 
                      ? '✅ Ready to auto-upgrade to Level 2!' 
                      : `Need ${(20 - parseFloat(userLocks.p4)).toFixed(1)} more USDT`}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="p12" title="P12 Orbit (Level 2)">
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Header as="h5">Orbit Status</Card.Header>
                <Card.Body>
                  <p><strong>Current Position:</strong> {p12Data.currentIndex} / 12</p>
                  <div className="d-flex gap-2 flex-wrap">
                    {p12Data.positions.map((pos, i) => (
                      <div
                        key={i}
                        className={`p-2 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
                        style={{ width: '60px', textAlign: 'center' }}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
                <Card.Body>
                  <p><strong>Locked:</strong> {userLocks.p12} / 40 USDT</p>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p12) / 40) * 100} 
                    label={`${((parseFloat(userLocks.p12) / 40) * 100).toFixed(1)}%`}
                    variant="success"
                  />
                  <p className="mt-2 text-muted">
                    {parseFloat(userLocks.p12) >= 40 
                      ? '✅ Ready to auto-upgrade to Level 3!' 
                      : `Need ${(40 - parseFloat(userLocks.p12)).toFixed(1)} more USDT`}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="p39" title="P39 Orbit (Level 3)">
          <Row>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Header as="h5">Orbit Status</Card.Header>
                <Card.Body>
                  <p><strong>Current Position:</strong> {p39Data.currentIndex} / 39</p>
                  <div className="d-flex gap-1 flex-wrap">
                    {p39Data.positions.map((pos, i) => (
                      <div
                        key={i}
                        className={`p-1 border rounded ${pos.filled ? 'bg-success text-white' : 'bg-light'}`}
                        style={{ width: '35px', textAlign: 'center', fontSize: '12px' }}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="mb-3">
                <Card.Header as="h5">Your Auto-Upgrade</Card.Header>
                <Card.Body>
                  <p><strong>Locked:</strong> {userLocks.p39} / 80 USDT</p>
                  <ProgressBar 
                    now={(parseFloat(userLocks.p39) / 80) * 100} 
                    label={`${((parseFloat(userLocks.p39) / 80) * 100).toFixed(1)}%`}
                    variant="success"
                  />
                  <p className="mt-2 text-muted">
                    {parseFloat(userLocks.p39) >= 80 
                      ? '✅ Ready to auto-upgrade to Level 4!' 
                      : `Need ${(80 - parseFloat(userLocks.p39)).toFixed(1)} more USDT`}
                  </p>
                </Card.Body>
              </Card>
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

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchOrbitData = async () => {
//       if (!contracts || !account) return

//       try {
//         // P4 Orbit data
//         const p4Position = await contracts.p4Orbit.currentPosition()
//         const p4Locked = await contracts.escrow.getLockedAmount(account, 1, 2)
        
//         // P12 Orbit data
//         const p12Index = await contracts.p12Orbit.currentIndex()
//         const p12Locked = await contracts.escrow.getLockedAmount(account, 2, 3)
        
//         // P39 Orbit data
//         const p39Index = await contracts.p39Orbit.currentIndex()
//         const p39Locked = await contracts.escrow.getLockedAmount(account, 3, 4)

//         setP4Data({
//           currentPosition: Number(p4Position),
//           positions: Array(4).fill().map((_, i) => ({
//             filled: i < Number(p4Position)
//           }))
//         })

//         setP12Data({
//           currentIndex: Number(p12Index),
//           positions: Array(12).fill().map((_, i) => ({
//             filled: i < Number(p12Index)
//           }))
//         })

//         setP39Data({
//           currentIndex: Number(p39Index),
//           positions: Array(39).fill().map((_, i) => ({
//             filled: i < Number(p39Index)
//           }))
//         })

//         setUserLocks({
//           p4: ethers.formatUnits(p4Locked, 6),
//           p12: ethers.formatUnits(p12Locked, 6),
//           p39: ethers.formatUnits(p39Locked, 6)
//         })

//       } catch (err) {
//         console.error('Error fetching orbit data:', err)
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

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Orbits Dashboard</h1>

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