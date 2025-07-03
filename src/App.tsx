import { useEffect, useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'
import { HomeEntry } from './pages/home/HomeEntry'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CustomAppBar } from './CustomAppBar'

function App() {

  useEffect(() => {
    console.log("Start app!")
    window.ipcRenderer.echo("Hello World").then((val) => console.log(val))
  }, [])

  return (
    <div className='w-12/12 h-full flex flex-col '>
      <BrowserRouter>
        <CustomAppBar />

        <div className='mt-10'>
          <HomeEntry />
          {/* <HashRouter> */}
            {/* <Routes> */}
              {/* <Route path="/" element={<HomeEntry />} /> */}
              {/* <Route path="/settings" element={<Settings />} /> */}
            {/* </Routes> */}

          {/* </HashRouter> */}

        </div>

      </BrowserRouter>

    </div>

  )
}

export default App