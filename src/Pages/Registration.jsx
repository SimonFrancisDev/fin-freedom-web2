import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap'
import { useWallet } from '../hooks/useWallet'
import { useContracts } from '../hooks/useContracts'
import { ethers } from 'ethers'

export const Registration = () => {
  const { isConnected, account } = useWallet()
  const { contracts, isLoading, error, loadContracts } = useContracts()
  
  const [referrer, setReferrer] = useState('')
  const [level, setLevel] = useState(1)
  const [isRegistered, setIsRegistered] = useState(false)
  const [activeLevels, setActiveLevels] = useState({})
  const [usdtBalance, setUsdtBalance] = useState('0')
  const [allowance, setAllowance] = useState('0')
  const [txStatus, setTxStatus] = useState({ loading: false, hash: null, error: null })
  
  const levelPrices = {
    1: '10',
    2: '20',
    3: '40',
    4: '80',
    5: '160',
    6: '320',
    7: '640',
    8: '1280',
    9: '2560',
    10: '5120'
  }

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!contracts || !account) return

      try {
        console.log('Fetching user data...')
        
        // Check if registered
        const registered = await contracts.registration.isRegistered(account)
        setIsRegistered(registered)
        console.log('Registered:', registered)

        // Get referrer if registered
        if (registered) {
          const ref = await contracts.registration.getReferrer(account)
          setReferrer(ref)
        }

        // Get activated levels - use levelActivated mapping
        const levels = {}
        for (let i = 1; i <= 10; i++) {
          try {
            // FIXED: Use levelActivated mapping instead of isLevelActivated function
            const activated = await contracts.registration.levelActivated(account, i)
            levels[i] = activated
            console.log(`Level ${i} activated:`, activated)
          } catch (err) {
            console.error(`Error checking level ${i}:`, err)
            levels[i] = false
          }
        }
        setActiveLevels(levels)

        // Get USDT balance
        const balance = await contracts.usdt.balanceOf(account)
        setUsdtBalance(ethers.formatUnits(balance, 6))
        console.log('USDT balance:', ethers.formatUnits(balance, 6))

        // Get allowance for LevelManager
        const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
        setAllowance(ethers.formatUnits(allowance, 6))
        console.log('Allowance:', ethers.formatUnits(allowance, 6))

      } catch (err) {
        console.error('Error fetching user data:', err)
      }
    }

    fetchUserData()
  }, [contracts, account])

  const handleRegister = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.registration.register(referrer || ethers.ZeroAddress)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      setIsRegistered(true)
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const handleApprove = async () => {
    const price = ethers.parseUnits(levelPrices[level], 6)
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.usdt.approve(contracts.levelManager.target, price)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      const newAllowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
      setAllowance(ethers.formatUnits(newAllowance, 6))
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const handleActivateLevel = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      const tx = await contracts.registration.activateLevel(level)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      // Update activated levels - FIXED: Use levelActivated mapping
      const activated = await contracts.registration.levelActivated(account, level)
      setActiveLevels(prev => ({ ...prev, [level]: activated }))
      
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const canActivate = () => {
    if (level === 1) return !activeLevels[1]
    return !activeLevels[level] && activeLevels[level - 1]
  }

  if (!isConnected) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          Please connect your wallet to register and activate levels
        </Alert>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading contracts...</p>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Registration & Level Activation</h1>

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
            <Card.Header as="h5">Account Status</Card.Header>
            <Card.Body>
              <p><strong>Address:</strong> {account}</p>
              <p><strong>Registered:</strong> {isRegistered ? '✅ Yes' : '❌ No'}</p>
              {isRegistered && referrer !== ethers.ZeroAddress && (
                <p><strong>Referrer:</strong> {referrer}</p>
              )}
              <p><strong>USDT Balance:</strong> {usdtBalance} USDT</p>
              <p><strong>LevelManager Allowance:</strong> {allowance} USDT</p>
            </Card.Body>
          </Card>

          {!isRegistered ? (
            <Card className="mb-4">
              <Card.Header as="h5">Register</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Referrer Address (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="0x..."
                    value={referrer}
                    onChange={(e) => setReferrer(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  onClick={handleRegister}
                  disabled={txStatus.loading}
                >
                  {txStatus.loading ? 'Registering...' : 'Register'}
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Card className="mb-4">
              <Card.Header as="h5">Activate Level</Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Select Level</Form.Label>
                  <Form.Select 
                    value={level} 
                    onChange={(e) => setLevel(parseInt(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8,9,10].map(l => (
                      <option key={l} value={l} disabled={activeLevels[l]}>
                        Level {l} - {levelPrices[l]} USDT {activeLevels[l] ? '(Activated)' : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {parseFloat(allowance) < parseFloat(levelPrices[level]) && (
                  <Button
                    variant="warning"
                    onClick={handleApprove}
                    disabled={txStatus.loading}
                    className="mb-3 w-100"
                  >
                    Approve {levelPrices[level]} USDT
                  </Button>
                )}

                <Button
                  variant="success"
                  onClick={handleActivateLevel}
                  disabled={!canActivate() || txStatus.loading || parseFloat(allowance) < parseFloat(levelPrices[level])}
                  className="w-100"
                >
                  Activate Level {level}
                </Button>

                {!canActivate() && level > 1 && !activeLevels[level - 1] && (
                  <Alert variant="warning" className="mt-3">
                    ⚠️ You need to activate Level {level - 1} first
                  </Alert>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={6}>
          <Card>
            <Card.Header as="h5">Your Activated Levels</Card.Header>
            <Card.Body>
              <Row>
                {[1,2,3,4,5,6,7,8,9,10].map(levelNum => (
                  <Col xs={6} key={levelNum}>
                    <div className={`p-2 mb-2 border rounded ${activeLevels[levelNum] ? 'bg-success text-white' : 'bg-light'}`}>
                      Level {levelNum}: {activeLevels[levelNum] ? '✅ Activated' : '⏳ Not Activated'}
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}




// import React, { useState, useEffect } from 'react'
// import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap'
// import { useWallet } from '../hooks/useWallet'
// import { useContracts } from '../hooks/useContracts'
// import { ethers } from 'ethers'

// export const Registration = () => {
//   const { isConnected, account } = useWallet()
//   const { contracts, isLoading, error, loadContracts } = useContracts()
  
//   const [referrer, setReferrer] = useState('')
//   const [level, setLevel] = useState(1)
//   const [isRegistered, setIsRegistered] = useState(false)
//   const [activeLevels, setActiveLevels] = useState({})
//   const [usdtBalance, setUsdtBalance] = useState('0')
//   const [allowance, setAllowance] = useState('0')
//   const [txStatus, setTxStatus] = useState({ loading: false, hash: null, error: null })
  
//   const levelPrices = {
//     1: '10',
//     2: '20',
//     3: '40',
//     4: '80',
//     5: '160',
//     6: '320',
//     7: '640',
//     8: '1280',
//     9: '2560',
//     10: '5120'
//   }

//   useEffect(() => {
//     if (isConnected) {
//       loadContracts()
//     }
//   }, [isConnected])

//   useEffect(() => {
//     // const fetchUserData = async () => {
//     //   if (!contracts || !account) return

//     //   try {
//     //     // Check if registered
//     //     const registered = await contracts.registration.isRegistered(account)
//     //     setIsRegistered(registered)

//     //     // Get referrer if registered
//     //     if (registered) {
//     //       const ref = await contracts.registration.getReferrer(account)
//     //       setReferrer(ref)
//     //     }

//     //     // Get activated levels
//     //     const levels = {}
//     //     for (let i = 1; i <= 10; i++) {
//     //       const activated = await contracts.registration.isLevelActivated(account, i)
//     //       levels[i] = activated
//     //     }
//     //     setActiveLevels(levels)

//     //     // Get USDT balance
//     //     const balance = await contracts.usdt.balanceOf(account)
//     //     setUsdtBalance(ethers.formatUnits(balance, 6))

//     //     // Get allowance for LevelManager
//     //     const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
//     //     setAllowance(ethers.formatUnits(allowance, 6))

//     //   } catch (err) {
//     //     console.error('Error fetching user data:', err)
//     //   }
//     // }

//     // Inside Registration.jsx, update the fetchUserData function:

// const fetchUserData = async () => {
//   if (!contracts || !account) return

//   try {
//     console.log('Fetching user data...')
    
//     // Check if registered
//     const registered = await contracts.registration.isRegistered(account)
//     setIsRegistered(registered)
//     console.log('Registered:', registered)

//     // Get referrer if registered
//     if (registered) {
//       const ref = await contracts.registration.getReferrer(account)
//       setReferrer(ref)
//     }

//     // Get activated levels - use levelActivated mapping
//     const levels = {}
//     for (let i = 1; i <= 10; i++) {
//       try {
//         // Use levelActivated mapping instead of isLevelActivated function
//         const activated = await contracts.registration.levelActivated(account, i)
//         levels[i] = activated
//         console.log(`Level ${i} activated:`, activated)
//       } catch (err) {
//         console.error(`Error checking level ${i}:`, err)
//         levels[i] = false
//       }
//     }
//     setActiveLevels(levels)

//     // Get USDT balance
//     const balance = await contracts.usdt.balanceOf(account)
//     setUsdtBalance(ethers.formatUnits(balance, 6))
//     console.log('USDT balance:', ethers.formatUnits(balance, 6))

//     // Get allowance for LevelManager
//     const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
//     setAllowance(ethers.formatUnits(allowance, 6))
//     console.log('Allowance:', ethers.formatUnits(allowance, 6))

//   } catch (err) {
//     console.error('Error fetching user data:', err)
//   }
// }

//     fetchUserData()
//   }, [contracts, account])

//   const handleRegister = async () => {
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.registration.register(referrer || ethers.ZeroAddress)
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
//       setIsRegistered(true)
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   const handleApprove = async () => {
//     const price = ethers.parseUnits(levelPrices[level], 6)
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.usdt.approve(contracts.levelManager.target, price)
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
      
//       const newAllowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
//       setAllowance(ethers.formatUnits(newAllowance, 6))
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   const handleActivateLevel = async () => {
//     setTxStatus({ loading: true, hash: null, error: null })
//     try {
//       const tx = await contracts.registration.activateLevel(level)
//       setTxStatus({ loading: true, hash: tx.hash, error: null })
//       await tx.wait()
      
//       // Update activated levels
//       const activated = await contracts.registration.isLevelActivated(account, level)
//       setActiveLevels(prev => ({ ...prev, [level]: activated }))
      
//       setTxStatus({ loading: false, hash: tx.hash, error: null })
//     } catch (err) {
//       setTxStatus({ loading: false, hash: null, error: err.message })
//     }
//   }

//   const canActivate = () => {
//     if (level === 1) return !activeLevels[1]
//     return !activeLevels[level] && activeLevels[level - 1]
//   }

//   if (!isConnected) {
//     return (
//       <Container className="mt-5">
//         <Alert variant="info">
//           Please connect your wallet to register and activate levels
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

//   return (
//     <Container className="mt-4">
//       <h1 className="mb-4">Registration & Level Activation</h1>

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
//             <Card.Header as="h5">Account Status</Card.Header>
//             <Card.Body>
//               <p><strong>Address:</strong> {account}</p>
//               <p><strong>Registered:</strong> {isRegistered ? '✅ Yes' : '❌ No'}</p>
//               {isRegistered && referrer !== ethers.ZeroAddress && (
//                 <p><strong>Referrer:</strong> {referrer}</p>
//               )}
//               <p><strong>USDT Balance:</strong> {usdtBalance} USDT</p>
//               <p><strong>LevelManager Allowance:</strong> {allowance} USDT</p>
//             </Card.Body>
//           </Card>

//           {!isRegistered ? (
//             <Card className="mb-4">
//               <Card.Header as="h5">Register</Card.Header>
//               <Card.Body>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Referrer Address (optional)</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="0x..."
//                     value={referrer}
//                     onChange={(e) => setReferrer(e.target.value)}
//                   />
//                 </Form.Group>
//                 <Button
//                   variant="primary"
//                   onClick={handleRegister}
//                   disabled={txStatus.loading}
//                 >
//                   {txStatus.loading ? 'Registering...' : 'Register'}
//                 </Button>
//               </Card.Body>
//             </Card>
//           ) : (
//             <Card className="mb-4">
//               <Card.Header as="h5">Activate Level</Card.Header>
//               <Card.Body>
//                 <Form.Group className="mb-3">
//                   <Form.Label>Select Level</Form.Label>
//                   <Form.Select 
//                     value={level} 
//                     onChange={(e) => setLevel(parseInt(e.target.value))}
//                   >
//                     {[1,2,3,4,5,6,7,8,9,10].map(l => (
//                       <option key={l} value={l} disabled={activeLevels[l]}>
//                         Level {l} - {levelPrices[l]} USDT {activeLevels[l] ? '(Activated)' : ''}
//                       </option>
//                     ))}
//                   </Form.Select>
//                 </Form.Group>

//                 {parseFloat(allowance) < parseFloat(levelPrices[level]) && (
//                   <Button
//                     variant="warning"
//                     onClick={handleApprove}
//                     disabled={txStatus.loading}
//                     className="mb-3 w-100"
//                   >
//                     Approve {levelPrices[level]} USDT
//                   </Button>
//                 )}

//                 <Button
//                   variant="success"
//                   onClick={handleActivateLevel}
//                   disabled={!canActivate() || txStatus.loading || parseFloat(allowance) < parseFloat(levelPrices[level])}
//                   className="w-100"
//                 >
//                   Activate Level {level}
//                 </Button>

//                 {!canActivate() && level > 1 && !activeLevels[level - 1] && (
//                   <Alert variant="warning" className="mt-3">
//                     ⚠️ You need to activate Level {level - 1} first
//                   </Alert>
//                 )}
//               </Card.Body>
//             </Card>
//           )}
//         </Col>

//         <Col md={6}>
//           <Card>
//             <Card.Header as="h5">Your Activated Levels</Card.Header>
//             <Card.Body>
//               <Row>
//                 {[1,2,3,4,5,6,7,8,9,10].map(levelNum => (
//                   <Col xs={6} key={levelNum}>
//                     <div className={`p-2 mb-2 border rounded ${activeLevels[levelNum] ? 'bg-success text-white' : 'bg-light'}`}>
//                       Level {levelNum}: {activeLevels[levelNum] ? '✅ Activated' : '⏳ Not Activated'}
//                     </div>
//                   </Col>
//                 ))}
//               </Row>
//             </Card.Body>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   )
// }