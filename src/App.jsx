import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { Navigation } from './components/Layout/Navbar'
import { Dashboard } from './pages/Dashboard.jsx';
import { Registration } from './pages/Registration'
import { Orbits } from './pages/Orbits'
import { FounderPanel } from './pages/FounderPanel'
import { AdminPanel } from './pages/AdminPanel'
import './App.css'

function App() {
  return (
    <>
      <Navigation />
      <Container fluid className="mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/orbits" element={<Orbits />} />
          <Route path="/founder" element={<FounderPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Container>
    </>
  )
}

export default App