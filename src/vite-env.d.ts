/// <reference types="vite/client" />

// const ipcRenderer = import('electron').IpcRenderer;

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: {

    on: (...args: Parameters<typeof import('electron').ipcRenderer.on>) => void;
    off: (...args: Parameters<typeof import('electron').ipcRenderer.off>) => void;
    send: (...args: Parameters<typeof import('electron').ipcRenderer.send>) => void;
    invoke: (...args: Parameters<typeof import('electron').ipcRenderer.invoke>) => Promise<any>;

    // user-defined shortcut methods
    echo: (message: string) => Promise<string>;

    onRealtimeScreenMsg: (
      callback: (event: Electron.IpcRendererEvent, msg: IRealtimeScreenDSClientMessage) => void
    ) => void;

    onLogEvent: (
      callback: (event: Electron.IpcRendererEvent, gasLog: IEncodedLog) => void
    ) => void;

    onRelayEvent: (
      callback: (event: Electron.IpcRendererEvent, relayReport: IReportRelayMsg) => void
    ) => void;

    sendSetRelayMsg: (
      msg: ISetRelayMsg
    ) => void;

    sendOtaFirmware: (
      otaMsg: IDownloadFirmMsg
    ) => void;

    onOtaMsg: (
      callback: (event: Electron.IpcRendererEvent, msg: {
        status?: OtaStatusValue
        process: OtaProcess
      }) => void
    ) => void;



    removeAllListener: () => void

  },



}
