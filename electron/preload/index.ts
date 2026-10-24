import { ipcRenderer, contextBridge, IpcRenderer } from 'electron'
import { IDownloadFirmMsg } from '@/ipc-shared/IDownloadFirmMsg'
import { OtaStatusValue } from '@/ipc-shared/IOtaStatus'
import { IReportRelayMsg } from '@/ipc-shared/IReportRelayMsg'
import { ISetRelayMsg } from '@/ipc-shared/ISetRelayMsg'
import { IEncodedLog } from '@/ipc-shared/Log'
import { OtaProcess } from '@/ipc-shared/OtaProcess'
import { realtimeScreenController } from 'electron/main/ipc-controllers/RealtimeScreenController'
import { IORMTimestampFilter } from '@/ipc-shared/IORMTimestampFilter'
import { ITcpRawLog } from 'electron/main/models/TcpRawLogBus'
import { IDeviceServiceDevice } from '@/ipc-shared/IDeviceServiceDevice'
import { IKeyboardButtonPressMsg } from '@/ipc-shared/IKeyboardButtonPressMsg'
import { ISetKeyboardModeMsg } from '@/ipc-shared/ISetKeyboardModeMsg'
import { IReportKeyboardModeMsg } from '@/ipc-shared/IReportKeyboardModeMsg'
import { IReportKeyboardButtonsPressedMsg } from '@/ipc-shared/IReportKeyboardButtonsPressedMsg'
import { IReportPresetMsg } from '@/ipc-shared/IReportPresetMsg'
import { IReportDetectorStateMsg } from '@/ipc-shared/IReportDetectorStateMsg'
import { ISetPresetMsg } from '@/ipc-shared/ISetPresetMsg'
//* ============ PatchPlan 26-7-21 ========
import { IKeyboardStatusMsg } from '@/ipc-shared/IPresetStatusMsg'
// * =========== End PatchPlan 26-7-21  ========
//* ============ PatchPlan 26-8-11 ========
import { IKeyboardPresetStatusMsg } from '@/ipc-shared/IPresetStatusMsg'
import { IStopBumpMsg } from '@/ipc-shared/IStopBumpMsg'
// * =========== End PatchPlan 26-8-11  ========
import {
  ISeenSimFrameLog,
  ISeenSimSnapshot,
  SEEN_SIM_CHANNEL,
  SEEN_SIM_FRAME_CHANNEL,
  SeenSimCommand,
} from '@/ipc-shared/seen-sim/SeenSimContracts'

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

  onPresetEvent: (
    callback: (event: Electron.IpcRendererEvent, preset: IReportPresetMsg) => void
  ) => {
    ipcRenderer.on('logi-preset-event', (event, preset: IReportPresetMsg) => {
      callback(event, preset)
    })
  },

  //* ============ PatchPlan 26-10-18 ========
  // §17 (nội bộ): state hiện tại của 3 máy phát hiện trên thiết bị
  onDetectorState: (
    callback: (event: Electron.IpcRendererEvent, state: IReportDetectorStateMsg) => void
  ) => {
    ipcRenderer.on('keyboard-detector-state', (event, state: IReportDetectorStateMsg) => {
      callback(event, state)
    })
  },
  // * =========== End PatchPlan 26-10-18  ========

  sendPresetRequest: (
    msg: ISetPresetMsg
  ) => ipcRenderer.send('preset-request', msg),

  //* ============ PatchPlan 26-8-11 ========
  // §15 từ 11-08-2026 dùng hình dạng {status, meta} riêng, không còn {status_code}
  onPresetStatus: (
    callback: (event: Electron.IpcRendererEvent, status: IKeyboardPresetStatusMsg) => void
  ) => {
    ipcRenderer.on('preset-request', (event, status: IKeyboardPresetStatusMsg) => {
      callback(event, status)
    })
  },

  sendStopBumpMsg: (
    msg: IStopBumpMsg
  ) => ipcRenderer.send('stop-bump', msg),

  onStopBumpStatus: (
    callback: (event: Electron.IpcRendererEvent, status: IKeyboardStatusMsg) => void
  ) => {
    ipcRenderer.on('stop-bump', (event, status: IKeyboardStatusMsg) => {
      callback(event, status)
    })
  },
  // * =========== End PatchPlan 26-8-11  ========

  onRelayEvent: (
    callback: (event: Electron.IpcRendererEvent, relayReport: IReportRelayMsg) => void
  ) => {
    ipcRenderer.on('relay', callback);
  },

  sendSetRelayMsg: (
    msg: ISetRelayMsg
  ) => ipcRenderer.send('relay', msg),

  sendKeyboardButtonPressMsg: (
    msg: IKeyboardButtonPressMsg
  ) => ipcRenderer.send('keyboard-press-virtual-buttons', msg),

  //* ============ PatchPlan 26-7-21 ========
  // D6: §12 Nhấn phím ảo giờ có phản hồi cuối cùng `{message_id, status_code, ...}`.
  // Cùng kênh với lệnh gửi đi, giống cách 'preset-request' đang làm.
  onKeyboardPressStatus: (
    callback: (event: Electron.IpcRendererEvent, status: IKeyboardStatusMsg) => void
  ) => {
    ipcRenderer.on('keyboard-press-virtual-buttons', (event, status: IKeyboardStatusMsg) => {
      callback(event, status)
    })
  },
  // * =========== End PatchPlan 26-7-21  ========

  sendSetKeyboardModeMsg: (
    msg: ISetKeyboardModeMsg
  ) => ipcRenderer.send('keyboard-mode', msg),

  onKeyboardModeMsg: (
    callback: (event: Electron.IpcRendererEvent, msg: IReportKeyboardModeMsg) => void
  ) => {
    ipcRenderer.on('keyboard-mode', (event, msg: IReportKeyboardModeMsg) => {
      callback(event, msg)
    })
  },

  onKeyboardButtonsPressedMsg: (
    callback: (event: Electron.IpcRendererEvent, msg: IReportKeyboardButtonsPressedMsg) => void
  ) => {
    ipcRenderer.on('keyboard-buttons-pressed', (event, msg: IReportKeyboardButtonsPressedMsg) => {
      callback(event, msg)
    })
  },

  getKeyboardMode: (
    deviceId?: string
  ) => ipcRenderer.invoke('keyboard-mode', { device_id: deviceId }),

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

  readLogsByTimestampRange: (
    filter: IORMTimestampFilter
  ) => ipcRenderer.invoke('logs', filter),

  onTcpRawLog: (
    callback: (event: Electron.IpcRendererEvent, msg: ITcpRawLog) => void
  ) => {
    ipcRenderer.on('tcp-raw-log', (event, msg: ITcpRawLog) => {
      callback(event, msg)
    })
  },

  onDevices: (
    callback: (event: Electron.IpcRendererEvent, devices: IDeviceServiceDevice[]) => void
  ) => {
    ipcRenderer.on('devices', (event, devices: IDeviceServiceDevice[]) => {
      callback(event, devices)
    })
  },

  getCachedDevices: () => ipcRenderer.invoke('devices'),

  // ================== BEGIN: SEEN device simulator (second window) ==================

  /** Open (or focus) the SEEN device-simulator window. */
  openSeenDeviceSim: () => ipcRenderer.invoke('open-seen-device-sim'),

  /** Fire a command to the simulator (connect, key press, nozzle, …). */
  sendSeenSimCommand: (cmd: SeenSimCommand) => ipcRenderer.send(SEEN_SIM_CHANNEL, cmd),

  /** Initial state fetch. */
  getSeenSimSnapshot: (): Promise<ISeenSimSnapshot> => ipcRenderer.invoke(SEEN_SIM_CHANNEL),

  /** Every state change of the simulator. */
  onSeenSimSnapshot: (
    callback: (event: Electron.IpcRendererEvent, snapshot: ISeenSimSnapshot) => void
  ) => {
    ipcRenderer.on(SEEN_SIM_CHANNEL, (event, snapshot: ISeenSimSnapshot) => {
      callback(event, snapshot)
    })
  },

  /** Raw device<->DS frames for the simulator's link (source "device"). */
  onSeenSimLog: (
    callback: (event: Electron.IpcRendererEvent, msg: ITcpRawLog) => void
  ) => {
    ipcRenderer.on('seen-device-sim-log', (event, msg: ITcpRawLog) => {
      callback(event, msg)
    })
  },

  /** One structured frame per device<->DS packet (log window + inspector). */
  onSeenSimFrame: (
    callback: (event: Electron.IpcRendererEvent, frame: ISeenSimFrameLog) => void
  ) => {
    ipcRenderer.on(SEEN_SIM_FRAME_CHANNEL, (event, frame: ISeenSimFrameLog) => {
      callback(event, frame)
    })
  },

  // ================== END: SEEN device simulator ==================

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