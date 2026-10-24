import { useEffect } from 'react'
import './App.css'
import { HomeEntry } from './pages/home/HomeEntry'
import { HashRouter, Routes, Route } from "react-router-dom";
import { SeenDeviceEntry } from './pages/seen-device/SeenDeviceEntry';

function App() {

  useEffect(() => {
    console.log("Start app!")
    window.ipcRenderer.echo("Hello World").then((val) => console.log(val))
  }, [])

  return (
    <div className='w-12/12 h-full flex flex-col '>
      {/*
        HashRouter (not BrowserRouter): the packaged renderer loads over file://
        and child windows are opened with a URL hash (`#/seen-device`).
      */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeEntry />} />
          <Route path="/seen-device" element={<SeenDeviceEntry />} />
        </Routes>
      </HashRouter>
    </div>
  )
}

export default App
