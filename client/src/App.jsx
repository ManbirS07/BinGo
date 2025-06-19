import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Home from './pages/Home'
import MovieDetails from './pages/MovieDetails'
import Favourite from './pages/Favourite'
import {Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Missions from './pages/Missions'

const App = () => {
const isAdminRoute = useLocation().pathname.startsWith('/admin')

  return (
    <>
    <Toaster/>
     {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/missions" element={<Missions/>} />
        <Route path="/missions/:id" element={<MovieDetails />} />
        <Route path='/missions/:id/:date' element={<SeatLayout />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/favourite" element={<Favourite />} />
        <Route path="/dashboard" element={<Dashboard/>} />
      </Routes>
       {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App
