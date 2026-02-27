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
  const [mintAmount, setMintAmount] = useState('100')
  // NEW: Deployer states
  const [isDeployer, setIsDeployer] = useState(false)
  const [deployerUsdtBalance, setDeployerUsdtBalance] = useState('0')
  const [transferAmount, setTransferAmount] = useState('100')
  const [transferAddress, setTransferAddress] = useState('')
  const [showTransferToSelf, setShowTransferToSelf] = useState(true)
  
  // LAB THEME STYLES (keep your existing styles)
  const registrationStyles = `
    @keyframes pulse-line {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes glow-red {
      0%, 100% { box-shadow: 0 0 5px rgba(220, 53, 69, 0.2); }
      50% { box-shadow: 0 0 20px rgba(220, 53, 69, 0.5); }
    }
    .lab-terminal {
      background: #ffffff;
      border: 1px solid rgba(0, 35, 102, 0.1);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 35, 102, 0.05);
      overflow: hidden;
      position: relative;
    }
    .terminal-header {
      background: #002366;
      color: white;
      font-family: 'monospace';
      font-size: 0.9rem;
      letter-spacing: 1px;
      padding: 12px 20px;
      border-bottom: 2px solid #0044cc;
    }
    .pulse-overlay {
      background-image: linear-gradient(90deg, transparent 0%, rgba(0, 35, 102, 0.03) 45%, rgba(0, 68, 204, 0.1) 50%, rgba(0, 35, 102, 0.03) 55%, transparent 100%);
      background-size: 200% 100%;
      animation: pulse-line 4s linear infinite;
    }
    .status-node {
      font-family: 'monospace';
      font-size: 0.75rem;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: 1px solid #eee;
    }
    .node-active {
      background: linear-gradient(135deg, #002366 0%, #0044cc 100%);
      color: white !important;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 68, 204, 0.3);
    }
    .btn-protocol {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 12px;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    .security-alert {
      animation: glow-red 2s infinite;
      border: none;
      border-radius: 12px;
      font-weight: 700;
    }
    .deployer-badge {
      background: #002366;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
      margin-left: 10px;
    }
    .faucet-section {
      border-top: 1px dashed #002366;
      margin-top: 15px;
      padding-top: 15px;
    }
  `;

  const levelPrices = {
    1: '10', 2: '20', 3: '40', 4: '80', 5: '160',
    6: '320', 7: '640', 8: '1280', 9: '2560', 10: '5120'
  }

  useEffect(() => {
    if (isConnected) { loadContracts() }
  }, [isConnected])

  // NEW: Check if current user is the deployer (owner of Registration contract)
  useEffect(() => {
    const checkDeployerStatus = async () => {
      if (!contracts || !account) return
      try {
        const owner = await contracts.registration.owner()
        const isOwner = owner.toLowerCase() === account.toLowerCase()
        setIsDeployer(isOwner)
        
        // If deployer, get their USDT balance
        if (isOwner && contracts.usdt) {
          const balance = await contracts.usdt.balanceOf(account)
          setDeployerUsdtBalance(ethers.formatUnits(balance, 6))
        }
        
        // Set transfer address to current account by default
        setTransferAddress(account)
      } catch (err) {
        console.error('Error checking deployer status:', err)
      }
    }
    checkDeployerStatus()
  }, [contracts, account])

  // Auto-refresh levels after any transaction
  useEffect(() => {
    const refreshAllLevels = async () => {
      if (!contracts || !account) return
      try {
        const levels = {}
        for (let i = 1; i <= 10; i++) {
          const activated = await contracts.registration.levelActivated(account, i)
          levels[i] = activated
        }
        setActiveLevels(levels)
      } catch (err) {
        console.error('Level refresh failed:', err)
      }
    }
    refreshAllLevels()
  }, [contracts, account, txStatus.hash])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!contracts || !account) return
      try {
        const registered = await contracts.registration.isRegistered(account)
        setIsRegistered(registered)
        if (registered) {
          const ref = await contracts.registration.getReferrer(account)
          setReferrer(ref)
        }
        const levels = {}
        for (let i = 1; i <= 10; i++) {
          try {
            const activated = await contracts.registration.levelActivated(account, i)
            levels[i] = activated
          } catch (err) {
            levels[i] = false
          }
        }
        setActiveLevels(levels)
        const balance = await contracts.usdt.balanceOf(account)
        setUsdtBalance(ethers.formatUnits(balance, 6))
        const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
        setAllowance(ethers.formatUnits(allowance, 6))
      } catch (err) {
        console.error('Data Extraction Failed:', err)
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

  // REMOVED: handleMint function - USDT cannot be minted by users
  // The mint function has been removed as regular users cannot mint USDT

  // NEW: Handle USDT transfer from deployer to self
  const handleTransferToSelf = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      if (!isDeployer) {
        throw new Error('Only deployer can transfer USDT')
      }
      
      const amount = ethers.parseUnits(transferAmount, 6)
      
      // Check deployer balance
      const balance = await contracts.usdt.balanceOf(account)
      if (balance < amount) {
        throw new Error(`Insufficient USDT balance. You have ${ethers.formatUnits(balance, 6)} USDT`)
      }
      
      // Transfer to self (current account)
      const tx = await contracts.usdt.transfer(account, amount)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      // Refresh balances
      const newBalance = await contracts.usdt.balanceOf(account)
      setUsdtBalance(ethers.formatUnits(newBalance, 6))
      setDeployerUsdtBalance(ethers.formatUnits(newBalance, 6))
      
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      console.error('Transfer error:', err)
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  // NEW: Handle USDT transfer from deployer to any address
  const handleTransferToAddress = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      if (!isDeployer) {
        throw new Error('Only deployer can transfer USDT')
      }
      
      if (!ethers.isAddress(transferAddress)) {
        throw new Error('Invalid recipient address')
      }
      
      const amount = ethers.parseUnits(transferAmount, 6)
      
      // Check deployer balance
      const balance = await contracts.usdt.balanceOf(account)
      if (balance < amount) {
        throw new Error(`Insufficient USDT balance. You have ${ethers.formatUnits(balance, 6)} USDT`)
      }
      
      // Transfer to specified address
      const tx = await contracts.usdt.transfer(transferAddress, amount)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      // Refresh deployer balance
      const newDeployerBalance = await contracts.usdt.balanceOf(account)
      setDeployerUsdtBalance(ethers.formatUnits(newDeployerBalance, 6))
      
      // If transferring to current account, refresh user balance too
      if (transferAddress.toLowerCase() === account.toLowerCase()) {
        const newBalance = await contracts.usdt.balanceOf(account)
        setUsdtBalance(ethers.formatUnits(newBalance, 6))
      }
      
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      console.error('Transfer error:', err)
      setTxStatus({ loading: false, hash: null, error: err.message })
    }
  }

  const handleActivateLevel = async () => {
    setTxStatus({ loading: true, hash: null, error: null })
    try {
      // Check balance first
      const balance = await contracts.usdt.balanceOf(account)
      const price = ethers.parseUnits(levelPrices[level], 6)
      if (balance < price) {
        throw new Error(`Insufficient USDT balance. You have ${ethers.formatUnits(balance, 6)} USDT but need ${levelPrices[level]} USDT. Please request USDT from the deployer.`)
      }

      // Check allowance
      const currentAllowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
      if (currentAllowance < price) {
        throw new Error(`Insufficient allowance. Please approve USDT spending first.`)
      }

      const tx = await contracts.registration.activateLevel(level)
      setTxStatus({ loading: true, hash: tx.hash, error: null })
      await tx.wait()
      
      const activated = await contracts.registration.levelActivated(account, level)
      setActiveLevels(prev => ({ ...prev, [level]: activated }))
      
      // Refresh balance and allowance
      const newBalance = await contracts.usdt.balanceOf(account)
      setUsdtBalance(ethers.formatUnits(newBalance, 6))
      const newAllowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
      setAllowance(ethers.formatUnits(newAllowance, 6))
      
      setTxStatus({ loading: false, hash: tx.hash, error: null })
    } catch (err) {
      console.error('Activation error:', err)
      
      // Refresh actual status to correct UI
      try {
        const actualStatus = await contracts.registration.levelActivated(account, level)
        setActiveLevels(prev => ({ ...prev, [level]: actualStatus }))
      } catch (refreshErr) {
        console.error('Error refreshing status:', refreshErr)
      }

      // Better error messages
      if (err.message?.includes('insufficient funds') || err.code === 'CALL_EXCEPTION') {
        setTxStatus({
          loading: false,
          hash: null,
          error: 'Transaction failed. This usually means you have insufficient USDT balance. Please request USDT from the deployer.'
        })
      } else {
        setTxStatus({ loading: false, hash: null, error: err.message })
      }
    }
  }

  const canActivate = () => {
    if (level === 1) return !activeLevels[1]
    return !activeLevels[level] && activeLevels[level - 1]
  }

  if (!isConnected) {
    return (
      <Container className="mt-5 pt-5 text-center">
        <Alert variant="primary" className="p-4" style={{backgroundColor: '#002366', color: 'white', borderRadius: '15px'}}>
          <h4 className="fw-bold">CRYPTOGRAPHIC HANDSHAKE REQUIRED</h4>
          <p className="m-0">Connect your Web3 terminal to initialize Protocol Registration.</p>
        </Alert>
      </Container>
    )
  }

  return (
    <Container className="mt-5 pt-5 pb-5">
      <style>{registrationStyles}</style>
      
      <div className="d-flex align-items-center mb-4">
        <div style={{height: '30px', width: '6px', background: '#002366', marginRight: '15px'}}></div>
        <h1 className="m-0 fw-black text-uppercase" style={{color: '#002366', letterSpacing: '1px', fontSize: '1.8rem'}}>System Registration</h1>
        {isDeployer && (
          <span className="deployer-badge">DEPLOYER</span>
        )}
      </div>

      {txStatus.error && (
        <Alert variant="danger" className="security-alert mb-4" dismissible onClose={() => setTxStatus({...txStatus, error: null})}>
          CORE_ERROR: {txStatus.error}
        </Alert>
      )}

      {txStatus.hash && (
        <Alert variant="info" className="mb-4 status-node border-0 shadow-sm">
          <strong>BROADCASTING_TX:</strong> <a href={`https://amoy.polygonscan.com/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">{txStatus.hash}</a>
        </Alert>
      )}

      <Row>
        <Col lg={7}>
          {/* Account Status Terminal */}
          <div className="lab-terminal mb-4">
            <div className="terminal-header">[ NODE_IDENTITY_STATUS ]</div>
            <div className="pulse-overlay p-4">
              <Row>
                <Col sm={6} className="mb-3">
                  <div className="small text-muted fw-bold text-uppercase">Public Address</div>
                  <div className="fw-bold" style={{color: '#002366', fontSize: '0.85rem'}}>{account.substring(0,18)}...</div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div className="small text-muted fw-bold text-uppercase">Ledger Status</div>
                  <div className={`fw-bold ${isRegistered ? 'text-success' : 'text-danger'}`}>
                    {isRegistered ? '● AUTHORIZED_MEMBER' : '○ UNAUTHORIZED_NODE'}
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="small text-muted fw-bold text-uppercase">Liquid Assets</div>
                  <div className="fw-bold" style={{color: '#002366'}}>{usdtBalance} <span className="small">USDT</span></div>
                </Col>
                <Col sm={6}>
                  <div className="small text-muted fw-bold text-uppercase">Manager Allowance</div>
                  <div className="fw-bold" style={{color: '#002366'}}>{allowance} <span className="small">USDT</span></div>
                </Col>
                {isDeployer && (
                  <Col sm={12} className="mt-3">
                    <div className="small text-muted fw-bold text-uppercase">Deployer USDT Balance</div>
                    <div className="fw-bold" style={{color: '#002366'}}>{deployerUsdtBalance} <span className="small">USDT</span></div>
                  </Col>
                )}
              </Row>
            </div>
          </div>

          {/* REPLACED: Mint USDT Terminal with Deployer USDT Faucet */}
          {isDeployer && (
            <div className="lab-terminal mb-4">
              <div className="terminal-header">[ DEPLOYER_USDT_FAUCET ]</div>
              <div className="p-4">
                <div className="mb-3">
                  <Form.Check 
                    type="switch"
                    id="transfer-mode-switch"
                    label="Transfer to specific address"
                    checked={!showTransferToSelf}
                    onChange={() => setShowTransferToSelf(!showTransferToSelf)}
                  />
                </div>
                
                {showTransferToSelf ? (
                  // Simple transfer to self
                  <>
                    <Row>
                      <Col md={8}>
                        <Form.Control
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className="status-node mb-2"
                          placeholder="Amount"
                        />
                      </Col>
                      <Col md={4}>
                        <Button
                          variant="success"
                          className="btn-protocol w-100"
                          onClick={handleTransferToSelf}
                          disabled={txStatus.loading}
                          style={{background: '#28a745'}}
                        >
                          {txStatus.loading ? <Spinner size="sm" /> : 'SEND TO SELF'}
                        </Button>
                      </Col>
                    </Row>
                    <div className="small text-muted mt-2">
                      Transfer USDT from deployer to your current address.
                    </div>
                  </>
                ) : (
                  // Transfer to any address
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-muted text-uppercase">Recipient Address</Form.Label>
                      <Form.Control
                        type="text"
                        value={transferAddress}
                        onChange={(e) => setTransferAddress(e.target.value)}
                        className="status-node"
                        placeholder="0x..."
                      />
                    </Form.Group>
                    <Row>
                      <Col md={8}>
                        <Form.Control
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          className="status-node mb-2"
                          placeholder="Amount"
                        />
                      </Col>
                      <Col md={4}>
                        <Button
                          variant="success"
                          className="btn-protocol w-100"
                          onClick={handleTransferToAddress}
                          disabled={txStatus.loading}
                          style={{background: '#28a745'}}
                        >
                          {txStatus.loading ? <Spinner size="sm" /> : 'TRANSFER'}
                        </Button>
                      </Col>
                    </Row>
                    <div className="small text-muted mt-2">
                      Transfer USDT from deployer to any test address.
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* If not deployer, show informational message about getting USDT */}
          {!isDeployer && (
            <div className="lab-terminal mb-4">
              <div className="terminal-header">[ USDT_ACQUISITION ]</div>
              <div className="p-4">
                <Alert variant="info" className="mb-0">
                  <strong>⚠️ USDT Required for Activation</strong>
                  <p className="mt-2 mb-0 small">
                    You need USDT to activate levels. Since this is testnet, please request USDT from the deployer.
                    The deployer can send USDT to your address using their faucet.
                  </p>
                </Alert>
              </div>
            </div>
          )}

          {/* Action Terminal */}
          <div className="lab-terminal mb-4">
            <div className="terminal-header">{!isRegistered ? '[ INITIALIZE_HANDSHAKE ]' : '[ UPGRADE_CIPHER_LEVEL ]'}</div>
            <div className="p-4">
              {!isRegistered ? (
                <Form>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Uplink Referrer (Hex Address)</Form.Label>
                    <Form.Control
                      className="status-node p-3"
                      type="text"
                      placeholder="0x000..."
                      value={referrer}
                      onChange={(e) => setReferrer(e.target.value)}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    className="btn-protocol w-100"
                    onClick={handleRegister}
                    disabled={txStatus.loading}
                    style={{background: '#002366'}}
                  >
                    {txStatus.loading ? <Spinner size="sm" /> : 'EXECUTE_REGISTRATION'}
                  </Button>
                </Form>
              ) : (
                <>
                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted text-uppercase">Select Protocol Tier</Form.Label>
                    <Form.Select 
                      className="status-node p-3"
                      value={level} 
                      onChange={(e) => setLevel(parseInt(e.target.value))}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(l => (
                        <option key={l} value={l} disabled={activeLevels[l]}>
                          TIER {l.toString().padStart(2, '0')} — {levelPrices[l]} USDT {activeLevels[l] ? '(ALREADY_UNLOCKED)' : ''}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <div className="d-grid gap-3">
                    {parseFloat(allowance) < parseFloat(levelPrices[level]) && (
                      <Button
                        variant="warning"
                        onClick={handleApprove}
                        disabled={txStatus.loading}
                        className="btn-protocol py-3"
                      >
                        AUTHORIZE_TREASURY_TRANSFER
                      </Button>
                    )}

                    <Button
                      variant="success"
                      onClick={handleActivateLevel}
                      disabled={!canActivate() || txStatus.loading || parseFloat(allowance) < parseFloat(levelPrices[level])}
                      className="btn-protocol py-3"
                      style={{background: '#0044cc', border: 'none'}}
                    >
                      {txStatus.loading ? <Spinner size="sm" /> : `ACTIVATE_CIPHER_L${level}`}
                    </Button>
                  </div>

                  {!canActivate() && level > 1 && !activeLevels[level - 1] && (
                    <div className="mt-3 p-3 bg-light border-start border-warning border-4 small fw-bold">
                      ⚠️ SEQUENCE_ERROR: Tier {level - 1} must be synchronized before Tier {level}.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Col>

        <Col lg={5}>
          {/* Neural Map / Levels Grid */}
          <div className="lab-terminal">
            <div className="terminal-header">[ PROTOCOL_SYNC_MAP ]</div>
            <div className="pulse-overlay p-4">
              <Row className="g-2">
                {[1,2,3,4,5,6,7,8,9,10].map(levelNum => (
                  <Col xs={6} key={levelNum}>
                    <div className={`p-3 status-node text-center ${activeLevels[levelNum] ? 'node-active' : 'bg-white'}`}>
                      <div className="small opacity-75 fw-bold">TIER_{levelNum.toString().padStart(2, '0')}</div>
                      <div className="fw-black mt-1" style={{fontSize: '0.65rem'}}>
                        {activeLevels[levelNum] ? '● UNLOCKED' : '○ ENCRYPTED'}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
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
  
//   // LAB THEME STYLES
//   const registrationStyles = `
//     @keyframes pulse-line {
//       0% { background-position: 0% 50%; }
//       100% { background-position: 200% 50%; }
//     }
//     @keyframes glow-red {
//       0%, 100% { box-shadow: 0 0 5px rgba(220, 53, 69, 0.2); }
//       50% { box-shadow: 0 0 20px rgba(220, 53, 69, 0.5); }
//     }
//     .lab-terminal {
//       background: #ffffff;
//       border: 1px solid rgba(0, 35, 102, 0.1);
//       border-radius: 20px;
//       box-shadow: 0 10px 30px rgba(0, 35, 102, 0.05);
//       overflow: hidden;
//       position: relative;
//     }
//     .terminal-header {
//       background: #002366;
//       color: white;
//       font-family: 'monospace';
//       font-size: 0.9rem;
//       letter-spacing: 1px;
//       padding: 12px 20px;
//       border-bottom: 2px solid #0044cc;
//     }
//     .pulse-overlay {
//       background-image: linear-gradient(90deg, transparent 0%, rgba(0, 35, 102, 0.03) 45%, rgba(0, 68, 204, 0.1) 50%, rgba(0, 35, 102, 0.03) 55%, transparent 100%);
//       background-size: 200% 100%;
//       animation: pulse-line 4s linear infinite;
//     }
//     .status-node {
//       font-family: 'monospace';
//       font-size: 0.75rem;
//       border-radius: 12px;
//       transition: all 0.3s ease;
//       border: 1px solid #eee;
//     }
//     .node-active {
//       background: linear-gradient(135deg, #002366 0%, #0044cc 100%);
//       color: white !important;
//       border: none;
//       box-shadow: 0 4px 12px rgba(0, 68, 204, 0.3);
//     }
//     .btn-protocol {
//       font-weight: 800;
//       text-transform: uppercase;
//       letter-spacing: 1.5px;
//       padding: 12px;
//       border-radius: 12px;
//       transition: all 0.3s ease;
//     }
//     .security-alert {
//       animation: glow-red 2s infinite;
//       border: none;
//       border-radius: 12px;
//       font-weight: 700;
//     }
//   `;

//   const levelPrices = {
//     1: '10', 2: '20', 3: '40', 4: '80', 5: '160',
//     6: '320', 7: '640', 8: '1280', 9: '2560', 10: '5120'
//   }

//   useEffect(() => {
//     if (isConnected) { loadContracts() }
//   }, [isConnected])

//   useEffect(() => {
//     const fetchUserData = async () => {
//       if (!contracts || !account) return
//       try {
//         const registered = await contracts.registration.isRegistered(account)
//         setIsRegistered(registered)
//         if (registered) {
//           const ref = await contracts.registration.getReferrer(account)
//           setReferrer(ref)
//         }
//         const levels = {}
//         for (let i = 1; i <= 10; i++) {
//           try {
//             const activated = await contracts.registration.levelActivated(account, i)
//             levels[i] = activated
//           } catch (err) {
//             levels[i] = false
//           }
//         }
//         setActiveLevels(levels)
//         const balance = await contracts.usdt.balanceOf(account)
//         setUsdtBalance(ethers.formatUnits(balance, 6))
//         const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
//         setAllowance(ethers.formatUnits(allowance, 6))
//       } catch (err) {
//         console.error('Data Extraction Failed:', err)
//       }
//     }
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
//       const activated = await contracts.registration.levelActivated(account, level)
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
//       <Container className="mt-5 pt-5 text-center">
//         <Alert variant="primary" className="p-4" style={{backgroundColor: '#002366', color: 'white', borderRadius: '15px'}}>
//           <h4 className="fw-bold">CRYPTOGRAPHIC HANDSHAKE REQUIRED</h4>
//           <p className="m-0">Connect your Web3 terminal to initialize Protocol Registration.</p>
//         </Alert>
//       </Container>
//     )
//   }

//   return (
//     <Container className="mt-5 pt-5 pb-5">
//       <style>{registrationStyles}</style>
      
//       <div className="d-flex align-items-center mb-4">
//         <div style={{height: '30px', width: '6px', background: '#002366', marginRight: '15px'}}></div>
//         <h1 className="m-0 fw-black text-uppercase" style={{color: '#002366', letterSpacing: '1px', fontSize: '1.8rem'}}>System Registration</h1>
//       </div>

//       {txStatus.error && (
//         <Alert variant="danger" className="security-alert mb-4" dismissible>
//           CORE_ERROR: {txStatus.error}
//         </Alert>
//       )}

//       {txStatus.hash && (
//         <Alert variant="info" className="mb-4 status-node border-0 shadow-sm">
//           <strong>BROADCASTING_TX:</strong> <a href={`https://amoy.polygonscan.com/tx/${txStatus.hash}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">{txStatus.hash}</a>
//         </Alert>
//       )}

//       <Row>
//         <Col lg={7}>
//           {/* Account Status Terminal */}
//           <div className="lab-terminal mb-4">
//             <div className="terminal-header">[ NODE_IDENTITY_STATUS ]</div>
//             <div className="pulse-overlay p-4">
//               <Row>
//                 <Col sm={6} className="mb-3">
//                   <div className="small text-muted fw-bold text-uppercase">Public Address</div>
//                   <div className="fw-bold" style={{color: '#002366', fontSize: '0.85rem'}}>{account.substring(0,18)}...</div>
//                 </Col>
//                 <Col sm={6} className="mb-3">
//                   <div className="small text-muted fw-bold text-uppercase">Ledger Status</div>
//                   <div className={`fw-bold ${isRegistered ? 'text-success' : 'text-danger'}`}>
//                     {isRegistered ? '● AUTHORIZED_MEMBER' : '○ UNAUTHORIZED_NODE'}
//                   </div>
//                 </Col>
//                 <Col sm={6}>
//                   <div className="small text-muted fw-bold text-uppercase">Liquid Assets</div>
//                   <div className="fw-bold" style={{color: '#002366'}}>{usdtBalance} <span className="small">USDT</span></div>
//                 </Col>
//                 <Col sm={6}>
//                   <div className="small text-muted fw-bold text-uppercase">Manager Allowance</div>
//                   <div className="fw-bold" style={{color: '#002366'}}>{allowance} <span className="small">USDT</span></div>
//                 </Col>
//               </Row>
//             </div>
//           </div>

//           {/* Action Terminal */}
//           <div className="lab-terminal mb-4">
//             <div className="terminal-header">{!isRegistered ? '[ INITIALIZE_HANDSHAKE ]' : '[ UPGRADE_CIPHER_LEVEL ]'}</div>
//             <div className="p-4">
//               {!isRegistered ? (
//                 <Form>
//                   <Form.Group className="mb-4">
//                     <Form.Label className="small fw-bold text-muted text-uppercase">Uplink Referrer (Hex Address)</Form.Label>
//                     <Form.Control
//                       className="status-node p-3"
//                       type="text"
//                       placeholder="0x000..."
//                       value={referrer}
//                       onChange={(e) => setReferrer(e.target.value)}
//                     />
//                   </Form.Group>
//                   <Button
//                     variant="primary"
//                     className="btn-protocol w-100"
//                     onClick={handleRegister}
//                     disabled={txStatus.loading}
//                     style={{background: '#002366'}}
//                   >
//                     {txStatus.loading ? <Spinner size="sm" /> : 'EXECUTE_REGISTRATION'}
//                   </Button>
//                 </Form>
//               ) : (
//                 <>
//                   <Form.Group className="mb-4">
//                     <Form.Label className="small fw-bold text-muted text-uppercase">Select Protocol Tier</Form.Label>
//                     <Form.Select 
//                       className="status-node p-3"
//                       value={level} 
//                       onChange={(e) => setLevel(parseInt(e.target.value))}
//                     >
//                       {[1,2,3,4,5,6,7,8,9,10].map(l => (
//                         <option key={l} value={l} disabled={activeLevels[l]}>
//                           TIER {l.toString().padStart(2, '0')} — {levelPrices[l]} USDT {activeLevels[l] ? '(ALREADY_UNLOCKED)' : ''}
//                         </option>
//                       ))}
//                     </Form.Select>
//                   </Form.Group>

//                   <div className="d-grid gap-3">
//                     {parseFloat(allowance) < parseFloat(levelPrices[level]) && (
//                       <Button
//                         variant="warning"
//                         onClick={handleApprove}
//                         disabled={txStatus.loading}
//                         className="btn-protocol py-3"
//                       >
//                         AUTHORIZE_TREASURY_TRANSFER
//                       </Button>
//                     )}

//                     <Button
//                       variant="success"
//                       onClick={handleActivateLevel}
//                       disabled={!canActivate() || txStatus.loading || parseFloat(allowance) < parseFloat(levelPrices[level])}
//                       className="btn-protocol py-3"
//                       style={{background: '#0044cc', border: 'none'}}
//                     >
//                       {txStatus.loading ? <Spinner size="sm" /> : `ACTIVATE_CIPHER_L${level}`}
//                     </Button>
//                   </div>

//                   {!canActivate() && level > 1 && !activeLevels[level - 1] && (
//                     <div className="mt-3 p-3 bg-light border-start border-warning border-4 small fw-bold">
//                       ⚠️ SEQUENCE_ERROR: Tier {level - 1} must be synchronized before Tier {level}.
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </Col>

//         <Col lg={5}>
//           {/* Neural Map / Levels Grid */}
//           <div className="lab-terminal">
//             <div className="terminal-header">[ PROTOCOL_SYNC_MAP ]</div>
//             <div className="pulse-overlay p-4">
//               <Row className="g-2">
//                 {[1,2,3,4,5,6,7,8,9,10].map(levelNum => (
//                   <Col xs={6} key={levelNum}>
//                     <div className={`p-3 status-node text-center ${activeLevels[levelNum] ? 'node-active' : 'bg-white'}`}>
//                       <div className="small opacity-75 fw-bold">TIER_{levelNum.toString().padStart(2, '0')}</div>
//                       <div className="fw-black mt-1" style={{fontSize: '0.65rem'}}>
//                         {activeLevels[levelNum] ? '● UNLOCKED' : '○ ENCRYPTED'}
//                       </div>
//                     </div>
//                   </Col>
//                 ))}
//               </Row>
//             </div>
//           </div>
//         </Col>
//       </Row>
//     </Container>
//   )
// }





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
//     const fetchUserData = async () => {
//       if (!contracts || !account) return

//       try {
//         console.log('Fetching user data...')
        
//         // Check if registered
//         const registered = await contracts.registration.isRegistered(account)
//         setIsRegistered(registered)
//         console.log('Registered:', registered)

//         // Get referrer if registered
//         if (registered) {
//           const ref = await contracts.registration.getReferrer(account)
//           setReferrer(ref)
//         }

//         // Get activated levels - use levelActivated mapping
//         const levels = {}
//         for (let i = 1; i <= 10; i++) {
//           try {
//             // FIXED: Use levelActivated mapping instead of isLevelActivated function
//             const activated = await contracts.registration.levelActivated(account, i)
//             levels[i] = activated
//             console.log(`Level ${i} activated:`, activated)
//           } catch (err) {
//             console.error(`Error checking level ${i}:`, err)
//             levels[i] = false
//           }
//         }
//         setActiveLevels(levels)

//         // Get USDT balance
//         const balance = await contracts.usdt.balanceOf(account)
//         setUsdtBalance(ethers.formatUnits(balance, 6))
//         console.log('USDT balance:', ethers.formatUnits(balance, 6))

//         // Get allowance for LevelManager
//         const allowance = await contracts.usdt.allowance(account, contracts.levelManager.target)
//         setAllowance(ethers.formatUnits(allowance, 6))
//         console.log('Allowance:', ethers.formatUnits(allowance, 6))

//       } catch (err) {
//         console.error('Error fetching user data:', err)
//       }
//     }

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
      
//       // Update activated levels - FIXED: Use levelActivated mapping
//       const activated = await contracts.registration.levelActivated(account, level)
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
