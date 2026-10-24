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

    onPresetEvent: (
      callback: (event: Electron.IpcRendererEvent, preset: IReportPresetMsg) => void
    ) => void;

    //* ============ PatchPlan 26-10-18 ========
    /** §17 (nội bộ): state hiện tại của 3 máy phát hiện Preset / PumpLog / PriceSet */
    onDetectorState: (
      callback: (event: Electron.IpcRendererEvent, state: import("@/ipc-shared/IReportDetectorStateMsg").IReportDetectorStateMsg) => void
    ) => void;
    // * =========== End PatchPlan 26-10-18  ========

    sendPresetRequest: (
      msg: ISetPresetMsg
    ) => void;

    //* ============ PatchPlan 26-7-21 ========
    /** §15 từ 11-08-2026 dùng hình dạng {status, meta} riêng - xem IKeyboardPresetStatusMsg */
    onPresetStatus: (
      callback: (event: Electron.IpcRendererEvent, status: IKeyboardPresetStatusMsg) => void
    ) => void;

    /** D6: §12 Nhấn phím ảo giờ cũng có phản hồi cuối cùng */
    onKeyboardPressStatus: (
      callback: (event: Electron.IpcRendererEvent, status: IKeyboardStatusMsg) => void
    ) => void;
    // * =========== End PatchPlan 26-7-21  ========

    //* ============ PatchPlan 26-8-11 ========
    sendStopBumpMsg: (
      msg: IStopBumpMsg
    ) => void;

    onStopBumpStatus: (
      callback: (event: Electron.IpcRendererEvent, status: IKeyboardStatusMsg) => void
    ) => void;
    // * =========== End PatchPlan 26-8-11  ========

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

    onKeyboardButtonsPressedMsg: (
      callback: (event: Electron.IpcRendererEvent, msg: IReportKeyboardButtonsPressedMsg) => void
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

    // ---- SEEN device simulator (second window) ----

    /** Open (or focus) the SEEN device-simulator window. */
    openSeenDeviceSim: () => Promise<void>;

    /** Fire a command to the simulator (connect, key press, nozzle, …). */
    sendSeenSimCommand: (cmd: import('@/ipc-shared/seen-sim/SeenSimContracts').SeenSimCommand) => void;

    /** Initial state fetch. */
    getSeenSimSnapshot: () => Promise<import('@/ipc-shared/seen-sim/SeenSimContracts').ISeenSimSnapshot>;

    /** Every state change of the simulator. */
    onSeenSimSnapshot: (
      callback: (
        event: Electron.IpcRendererEvent,
        snapshot: import('@/ipc-shared/seen-sim/SeenSimContracts').ISeenSimSnapshot
      ) => void
    ) => void;

    /** Raw device<->DS frames for the simulator's link. */
    onSeenSimLog: (
      callback: (event: Electron.IpcRendererEvent, msg: ITcpRawLog) => void
    ) => void;

    /** One structured frame per device<->DS packet (log window + inspector). */
    onSeenSimFrame: (
      callback: (
        event: Electron.IpcRendererEvent,
        frame: import('@/ipc-shared/seen-sim/SeenSimContracts').ISeenSimFrameLog
      ) => void
    ) => void;

    removeAllListener: () => void

  },



}
