
export enum OtaProcess {
    NONE = 0,
    DOWNLOADING_FIRM = 1, // firm is sending to device service
    ACTIVATING_FIRM = 2, // firm is being handled by device service and device
}