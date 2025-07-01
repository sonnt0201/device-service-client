import { useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { HomeEntry } from './pages/home/HomeEntry'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CustomAppBar } from './CustomAppBar'
import { OtaEntry } from './pages/ota/OtaEntry'

function App() {

  return (
    <div className='w-12/12 h-full flex flex-col '>
      <BrowserRouter>
        <CustomAppBar />

        <div className='mt-10'>
          <Routes>
            <Route path="/" element={<HomeEntry />} />
            <Route path="/ota" element={<OtaEntry />} />
          </Routes>
        </div>

      </BrowserRouter>

    </div>

  )
}

export default App