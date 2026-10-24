import { app, BrowserWindow, shell, ipcMain, screen } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import { echoController } from './ipc-controllers/EchoController'
import { realtimeScreenController } from './ipc-controllers/RealtimeScreenController'
import { logEventController } from './ipc-controllers/LogEventController'
import { relaycontroller } from './ipc-controllers/RelayController'
import { otaController } from './ipc-controllers/OTAController'
import { tcpRawLogController } from './ipc-controllers/TcpRawLogController'
import { deviceCacheController } from './ipc-controllers/DeviceCacheController'
import {
  keyboardVirtualButtonController,
  keyboardModeController,
  stopBumpController,
  keyboardButtonReportController,
  presetEventController,
  presetRequestController,
  detectorStateController,
} from './contexts/keyboard/ipc'
import {
  seenDeviceSimController,
  seenDeviceSimLogController,
  seenDeviceSimFrameLogController,
} from './simulators/seen-device'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
let seenSimWin: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

/**
 * The SEEN device-simulator window. Separate BrowserWindow, `#/seen-device`
 * route, its own IPC surface. Reuses the main renderer bundle (HashRouter).
 */
function openSeenSimWindow() {
  if (seenSimWin && !seenSimWin.isDestroyed()) {
    if (seenSimWin.isMinimized()) seenSimWin.restore()
    seenSimWin.focus()
    return
  }

  seenSimWin = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'SEEN Device Simulator',
    icon: path.join(process.env.VITE_PUBLIC as string, 'favicon.ico'),
    webPreferences: { preload },
  })

  const hash = '/seen-device'
  if (VITE_DEV_SERVER_URL) {
    seenSimWin.loadURL(`${VITE_DEV_SERVER_URL}#${hash}`)
    seenSimWin.webContents.openDevTools()
  } else {
    seenSimWin.loadFile(indexHtml, { hash })
  }

  seenDeviceSimController.bindTargetWindow(seenSimWin).start()
  seenDeviceSimLogController.bindTargetWindow(seenSimWin).start()
  seenDeviceSimFrameLogController.bindTargetWindow(seenSimWin).start()

  seenSimWin.on('closed', () => {
    seenDeviceSimController.removeTargetWindow()
    seenDeviceSimLogController.removeTargetWindow()
    seenDeviceSimFrameLogController.removeTargetWindow()
    seenSimWin = null
  })
}

async function createWindow() {

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width,
    height,
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },

  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}



app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// Open (or focus) the SEEN device-simulator window.
ipcMain.handle('open-seen-device-sim', () => {
  openSeenSimWindow()
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})

app.whenReady().then(() => createWindow()).then(() => {
  if (win) {
    echoController.bindTargetWindow(win).start();
    // Bind the main window to the realtime screen controller
    realtimeScreenController.bindTargetWindow(win);
    // console.log(win);
    realtimeScreenController.start();

    logEventController.bindTargetWindow(win).start();

    relaycontroller.bindTargetWindow(win).start();

    otaController.bindTargetWindow(win).start();

    tcpRawLogController.bindTargetWindow(win).start();

    deviceCacheController.bindTargetWindow(win).start();

    keyboardModeController.bindTargetWindow(win).start();

    keyboardButtonReportController.bindTargetWindow(win).start();

    presetEventController.bindTargetWindow(win).start();

    detectorStateController.bindTargetWindow(win).start();

    presetRequestController.bindTargetWindow(win).start();

    //* ============ PatchPlan 26-7-21 ========
    // Giờ là IPCControllerBaseV2 (để đẩy phản hồi §12 lên giao diện - D6),
    // mà V2.start() bắt buộc phải có target window trước.
    keyboardVirtualButtonController.bindTargetWindow(win).start();
    // * =========== End PatchPlan 26-7-21  ========

    //* ============ PatchPlan 26-8-11 ========
    stopBumpController.bindTargetWindow(win).start();
    // * =========== End PatchPlan 26-8-11  ========

  }
})



