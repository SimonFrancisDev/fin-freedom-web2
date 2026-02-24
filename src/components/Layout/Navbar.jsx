import React from 'react'
import { Navbar, Nav, Container } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap'
import { ConnectButton } from '../Wallet/ConnectButton'

export const Navigation = () => {
  // Enhanced CSS for Shimmer and Breathing Text
  const customStyles = `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes breathe {
      0%, 100% { opacity: 1; text-shadow: 0 0 10px rgba(255,255,255,0.3); }
      50% { opacity: 0.85; text-shadow: 0 0 20px rgba(255,255,255,0.6); }
    }
    .brand-text {
      color: #FFFFFF !important;
      font-weight: 800 !important;
      font-size: 1.6rem !important;
      letter-spacing: -0.5px;
      animation: breathe 3s infinite ease-in-out;
    }
    .nav-link-custom {
      color: #FFFFFF !important;
      opacity: 0.9;
      transition: all 0.3s ease;
      font-weight: 500 !important;
    }
    .nav-link-custom:hover {
      opacity: 1;
      text-shadow: 0 0 12px rgba(255,255,255,0.8);
      transform: translateY(-1px);
    }
    /* Fixing the hamburger icon color for mobile */
    .navbar-toggler-icon {
      filter: invert(1) grayscale(100%) brightness(200%);
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div className="fixed-top" style={{ left: 0, right: 0, zIndex: 1030 }}>
        
        {/* Main Navbar: Royal Blue + Sweep Animation */}
        <Navbar 
          expand="lg" 
          style={{ 
            background: 'linear-gradient(90deg, #002366 0%, #0044cc 50%, #002366 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 10s infinite linear',
            padding: '1.2rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)' 
          }}
        >
          <Container fluid className="px-5">
            <LinkContainer to="/">
              <Navbar.Brand className="brand-text">
                Fin-Freedom
              </Navbar.Brand>
            </LinkContainer>
            
            <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0" />
            
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center">
                <LinkContainer to="/"><Nav.Link className="nav-link-custom mx-2">Dashboard</Nav.Link></LinkContainer>
                <LinkContainer to="/register"><Nav.Link className="nav-link-custom mx-2">Register</Nav.Link></LinkContainer>
                <LinkContainer to="/orbits"><Nav.Link className="nav-link-custom mx-2">Orbits</Nav.Link></LinkContainer>
                <LinkContainer to="/founder"><Nav.Link className="nav-link-custom mx-2">Founder Panel</Nav.Link></LinkContainer>
                <LinkContainer to="/admin"><Nav.Link className="nav-link-custom mx-2">Admin</Nav.Link></LinkContainer>
                
                <div className="ms-lg-4 mt-3 mt-lg-0">
                  <ConnectButton />
                </div>
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Developer Message: High Contrast Warning Bar */}
        <div 
          className="text-center" 
          style={{ 
            backgroundColor: '#FFFFFF',
            color: '#002366',
            fontSize: '0.75rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            padding: '5px 0',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            borderTop: '1px solid #ddd'
          }}
        >
          Developer message: this site is for test purposes only
        </div>
      </div>
    </>
  )
}



// import React from 'react'
// import { Navbar, Nav, Container } from 'react-bootstrap'
// import { LinkContainer } from 'react-router-bootstrap'
// import { ConnectButton } from '../Wallet/ConnectButton'

// export const Navigation = () => {
//   return (
//     <Navbar bg="dark" variant="dark" expand="lg">
//       <Container fluid>
//         <LinkContainer to="/">
//           <Navbar.Brand>Freedom Protocol</Navbar.Brand>
//         </LinkContainer>
//         <Navbar.Toggle aria-controls="basic-navbar-nav" />
//         <Navbar.Collapse id="basic-navbar-nav">
//           <Nav className="me-auto">
//             <LinkContainer to="/">
//               <Nav.Link>Dashboard</Nav.Link>
//             </LinkContainer>
//             <LinkContainer to="/register">
//               <Nav.Link>Register</Nav.Link>
//             </LinkContainer>
//             <LinkContainer to="/orbits">
//               <Nav.Link>Orbits</Nav.Link>
//             </LinkContainer>
//             <LinkContainer to="/founder">
//               <Nav.Link>Founder Panel</Nav.Link>
//             </LinkContainer>
//             <LinkContainer to="/admin">
//               <Nav.Link>Admin</Nav.Link>
//             </LinkContainer>
//           </Nav>
//           <ConnectButton />
//         </Navbar.Collapse>
//       </Container>
//     </Navbar>
//   )
// }