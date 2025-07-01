import { ipcRenderer, contextBridge, IpcRenderer } from 'electron'
import { IDownloadFirmMsg } from 'electron/ipc-shared/IDownloadFirmMsg'
import { OtaStatusValue } from 'electron/ipc-shared/IOtaStatus'
import { IReportRelayMsg } from 'electron/ipc-shared/IReportRelayMsg'
import { ISetRelayMsg } from 'electron/ipc-shared/ISetRelayMsg'
import { IEncodedLog } from 'electron/ipc-shared/Log'
import { OtaProcess } from 'electron/ipc-shared/OtaProcess'
import { realtimeScreenController } from 'electron/main/ipc-controllers/RealtimeScreenController'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },


  // ================== USER-DEFINED APIs (CAUTIOUS: ALL THOSE CODES ARE PUT ON RENDERER-SIDE) ===================

  echo: (message: string) => ipcRenderer.invoke('echo', message),

  onRealtimeScreenMsg: (
    callback: (event: Electron.IpcRendererEvent,msg: IRealtimeScreenDSClientMessage) => void
  ) => {
    ipcRenderer.on('realtime-screen', (event, msg: IRealtimeScreenDSClientMessage) => {
      callback(event, msg)
    })
  },


  onLogEvent: (
    callback: (event: Electron.IpcRendererEvent, gasLog: IEncodedLog) => void
  ) => {
    ipcRenderer.on('logi-log-event', (event, gasLog: IEncodedLog) => {
      callback(event, gasLog)
    })
  },

  onRelayEvent: (
    callback: (event: Electron.IpcRendererEvent, relayReport: IReportRelayMsg) => void
  ) => {
    ipcRenderer.on('relay', callback);
  },

  sendSetRelayMsg: (
    msg: ISetRelayMsg
  ) => ipcRenderer.send('relay', msg),

  // ================== BEGIN: OTA ==================
  sendOtaFirmware: (
   otaMsg: IDownloadFirmMsg
  ) => ipcRenderer.send('ota', otaMsg),

  onOtaMsg: (
    callback: (event: Electron.IpcRendererEvent, msg:  {
        status?: OtaStatusValue
        process: OtaProcess
    }) => void
  ) => ipcRenderer.on('ota', callback),
  // ================= END: OTA ===================

  removeAllListener: ()=> {ipcRenderer.removeAllListeners()}

  // ======================= END: USER-DEFINED APIS ===============
})

// --------- Preload scripts loading ---------
function domReady(condition: DocumentReadyState[] = ['complete', 'interactive']) {
  return new Promise(resolve => {
    if (condition.includes(document.readyState)) {
      resolve(true)
    } else {
      document.addEventListener('readystatechange', () => {
        if (condition.includes(document.readyState)) {
          resolve(true)
        }
      })
    }
  })
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find(e => e === child)) {
      return parent.appendChild(child)
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find(e => e === child)) {
      return parent.removeChild(child)
    }
  },
}

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `
  const oStyle = document.createElement('style')
  const oDiv = document.createElement('div')

  oStyle.id = 'app-loading-style'
  oStyle.innerHTML = styleContent
  oDiv.className = 'app-loading-wrap'
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle)
      safeDOM.append(document.body, oDiv)
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle)
      safeDOM.remove(document.body, oDiv)
    },
  }
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading()
domReady().then(appendLoading)

window.onmessage = (ev) => {
  ev.data.payload === 'removeLoading' && removeLoading()
}

setTimeout(removeLoading, 4999)