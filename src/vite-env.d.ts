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

    sendSetKeyboardModeMsg: (
      msg: ISetKeyboardModeMsg
    ) => void;

    onKeyboardModeMsg: (
      callback: (event: Electron.IpcRendererEvent, msg: IReportKeyboardModeMsg) => void
    ) => void;

    getKeyboardMode: (
      deviceId?: string
    ) => Promise<IReportKeyboardModeMsg | undefined>;

    sendKeyboardButtonPressMsg: (
      msg: IKeyboardButtonPressMsg
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

    readLogsByTimestampRange: (
      filter: IORMTimestampFilter
    ) => Promise<IEncodedLog[]>;

    onTcpRawLog: (
      callback: (event: Electron.IpcRendererEvent, msg: ITcpRawLog) => void
    ) => void;

    onDevices: (
      callback: (event: Electron.IpcRendererEvent, devices: {
        connection_state: boolean;
        device_id: string;
        device_type: number;
        firm_version: number;
        message_id: string;
        message_type: number;
        updated_at: number;
      }[]) => void
    ) => void;

    getCachedDevices: () => Promise<{
      connection_state: boolean;
      device_id: string;
      device_type: number;
      firm_version: number;
      message_id: string;
      message_type: number;
      updated_at: number;
    }[]>;

    removeAllListener: () => void

  },



}
