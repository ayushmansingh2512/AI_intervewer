import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Otpverification from './pages/Otpverification'
import Dashboard from './pages/Dashboard'
import { Toaster } from 'react-hot-toast'
import WelcomeForm from './pages/WelcomeForm'

function App() {

  return (
    <>
    <Toaster position="top-right" reverseOrder={false} />
      <BrowserRouter>
     
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/Otp" element={<Otpverification />} />
          <Route path="/welcome-form" element={<WelcomeForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
