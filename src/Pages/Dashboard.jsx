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

  useEffect(() => {
    const checkNetwork = async () => {
      if (!window.ethereum) return
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      console.log('Current chain ID:', chainId)
      
      // FIXED: Changed from 0x13881 to 0x13882
      if (chainId !== '0x13882') {
        setNetworkWarning('Please switch to Polygon Amoy Testnet')
      } else {
        setNetworkWarning('')
      }
    }
    
    checkNetwork()
    
    // ADDED: Listen for chain changes
    const handleChainChanged = () => {
      window.location.reload()
    }
    
    window.ethereum?.on('chainChanged', handleChainChanged)
    
    return () => {
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  useEffect(() => {
    if (isConnected) {
      loadContracts()
    }
  }, [isConnected])

  useEffect(() => {
    const fetchData = async () => {
      if (!contracts || !account) return

      try {
        // Get contract balances
        const balances = {}
        for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
          if (name !== 'USDT') {
            const balance = await contracts.usdt.balanceOf(address)
            balances[name] = ethers.formatUnits(balance, 6)
          }
        }
        setContractBalances(balances)

        // Get user levels - FIXED: Use levelActivated mapping instead of isLevelActivated
        const levels = {}
        for (let i = 1; i <= 3; i++) {
          // CHANGED: contracts.registration.isLevelActivated → contracts.registration.levelActivated
          const activated = await contracts.registration.levelActivated(account, i)
          levels[`level${i}`] = activated
        }
        setUserLevels(levels)
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [contracts, account])

  if (!isConnected) {
    return (
      <Container className="mt-5">
        <Alert variant="info">
          Please connect your wallet to view the dashboard
        </Alert>
      </Container>
    )
  }

  if (networkWarning) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          ⚠️ {networkWarning}
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

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          Error: {error}
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Freedom Protocol Dashboard</h1>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Connected Account</Card.Title>
              <Card.Text>
                <strong>Address:</strong> {account}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h2>Your Levels</h2>
          <Row>
            {[1, 2, 3].map((level) => (
              <Col md={4} key={level}>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>Level {level}</Card.Title>
                    <Card.Text>
                      Status: {' '}
                      {userLevels[`level${level}`] ? (
                        <span className="text-success">Activated ✓</span>
                      ) : (
                        <span className="text-warning">Not Activated</span>
                      )}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <Row>
        <Col>
          <h2>Contract Balances (USDT)</h2>
          <Row>
            {Object.entries(contractBalances).map(([name, balance]) => (
              <Col md={4} key={name}>
                <Card className="mb-3">
                  <Card.Body>
                    <Card.Title>{name.replace(/_/g, ' ')}</Card.Title>
                    <Card.Text>
                      <strong>{balance} USDT</strong>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
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
      
//       if (chainId !== '0x13882') {
//         setNetworkWarning('Please switch to Polygon Amoy Testnet')
//       } else {
//         setNetworkWarning('') // Clear warning when network is correct
//       }
//     }
    
//     checkNetwork()
    
//     // Listen for chain changes
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
//   }, [isConnected, loadContracts])

//   useEffect(() => {
//     const fetchData = async () => {
//       if (!contracts || !account) return

//       try {
//         console.log('Fetching dashboard data...')
        
//         // Get contract balances
//         const balances = {}
//         for (const [name, address] of Object.entries(CONTRACT_ADDRESSES)) {
//           if (name !== 'USDT') {
//             try {
//               const balance = await contracts.usdt.balanceOf(address)
//               balances[name] = ethers.formatUnits(balance, 6)
//               console.log(`${name} balance:`, balances[name])
//             } catch (err) {
//               console.error(`Error fetching ${name} balance:`, err)
//               balances[name] = '0'
//             }
//           }
//         }
//         setContractBalances(balances)

//         // Get user levels
//         const levels = {}
//         for (let i = 1; i <= 3; i++) {
//           try {
//             // Use levelActivated mapping instead of isLevelActivated function
//             const activated = await contracts.registration.levelActivated(account, i)
//             levels[`level${i}`] = activated
//             console.log(`Level ${i} activated:`, activated)
//           } catch (err) {
//             console.error(`Error fetching level ${i}:`, err)
//             levels[`level${i}`] = false
//           }
//         }
//         setUserLevels(levels)
//       } catch (err) {
//         console.error('Error fetching dashboard data:', err)
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
//                 <strong>Address:</strong> {account}<br />
//                 <strong>Network:</strong> Polygon Amoy Testnet
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