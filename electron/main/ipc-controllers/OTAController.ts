import { IDownloadFirmMsg } from "@/ipc-shared/IDownloadFirmMsg";
import { IPCControllerBase } from "../base";
import { OtaStatusValue } from "../../../src/ipc-shared/IOtaStatus";
import { EventExchangeDSListener } from "../models/EventExchangeDSListener";
import { IObserver } from "../base/IObserver";
import { IEventMsg } from "../../../src/ipc-shared/IEventMsg";
import { MsgTypeValue } from "../../../src/ipc-shared/MessageType";
import { IPCControllerBaseV2 } from "../base/IPCControllerBaseV2";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { OtaProcess } from "../../../src/ipc-shared/OtaProcess";
import { IActiveFirmwareMsg } from "@/ipc-shared/IActiveFirmwareMsg";


class OTAController extends IPCControllerBaseV2<IDownloadFirmMsg, {
    status?: OtaStatusValue
    process: OtaProcess
}>

    implements IObserver<IEventMsg> {

    _logger: IMainLogger | undefined = new MainLogger("OTAController");


    private _tcpDSListener: EventExchangeDSListener = EventExchangeDSListener.getInstance()

    private _currentDownloadFirmMsgID: string = "" // holding msg id of ongoing ota msg to later detect response msg
    private _currentDeviceMAC: string = "" // holding device mac of device that has ongoing ota process
    // private _currentActiveFirmMsgID: string = "" // holding msg id of ongoing ota msg to later detect response msg

    /**
     * mark the ongoing step of ota process
     */
    private _otaCurrentStep: OtaProcess = OtaProcess.NONE;

    constructor() {
        super()

        this._logger = new MainLogger("OTAController");
        this._otaCurrentStep = OtaProcess.NONE;
        this._tcpDSListener = EventExchangeDSListener.getInstance()
        this._currentDownloadFirmMsgID = ""
        this._currentDeviceMAC = ""

        /// observer design pattern
        this._tcpDSListener
            .eventMsgNotifier
            .subcribe(this)


    }

    /**
     * [observer design pattern]
     * 
     * update msg from {@link EventExchangeDSListener} (actually from device service)
     * 
     * @param data 
     * @returns 
     */
    update(data: IEventMsg): void {

        // guard msg type
        // if (data.content.message_type !== MsgTypeValue.DOWNLOAD_FIRM) return ;


        // ============== main process ==========================

        // if msg belong to ongoing ota process, send status to renderer anyway
        if (data.id === this._currentDownloadFirmMsgID && data.content.status_code) {

            // const status = data.content as IOtaStatus
            const status = data.content.status_code
            // send status code any way
            this.sendMsgToTargetWindow({
                status: (status === 0) ? OtaStatusValue.SUCCESS : OtaStatusValue.OTHER_ERROR,
                process: this._otaCurrentStep
            })
        }


        // in case msg is response from ota download firm request 
        if (data.id === this._currentDownloadFirmMsgID
            && data.content.status_code === 0
            && this._otaCurrentStep === OtaProcess.DOWNLOADING_FIRM) {
            // download oke, start send active frim msg

            // guard empty ota device mac
            if (this._currentDeviceMAC === "") {
                this._logger?.error("OTA Current Device MAC is not set");
                return;
            }

            // change process step state
            this._otaCurrentStep = OtaProcess.ACTIVATING_FIRM

            const msgContent: IActiveFirmwareMsg = {
                "message_type": MsgTypeValue.ACTIVE_FIRM,
                "message_id": this._currentDownloadFirmMsgID,
                "device_id": this._currentDeviceMAC
            }

            const msgToSendDS: IEventMsg = {
                "id": this._currentDownloadFirmMsgID,
                content: msgContent
            }

            // send to device service
            this._tcpDSListener.send(JSON.stringify(msgToSendDS.content))

            this.sendMsgToTargetWindow({
                status: data.content.status_code,
                process: this._otaCurrentStep
            })


            // because device service now has error: not sending success noti when update ota successfully, 
            // process is auto jump to NONE state as notification of successfully ota
            this._resetOTAProcess();





        }

        // in case msg is response from active firmware request
        if (data.id === this._currentDownloadFirmMsgID
            && this._otaCurrentStep === OtaProcess.ACTIVATING_FIRM) {
            // firmware updated, work done, reset all
            this._currentDeviceMAC = ""
            this._currentDownloadFirmMsgID = ""
            this._otaCurrentStep = OtaProcess.NONE


        }


    }

    channel(): string {
        return 'ota'
    }

    on(event: Electron.IpcMainEvent, message: IDownloadFirmMsg): void {

        this._logger?.log("Current process: ", this._otaCurrentStep)

        //fired when receiving a firm file from renderer
        this._logger?.log("Received txt firm from Renderer, size: ", message.file.length)
        // guard another ongoing ota process
        if (this._otaCurrentStep !== OtaProcess.NONE) {
            this.sendMsgToTargetWindow({
                process: this._otaCurrentStep
            })

            this._logger?.error("Cannot start OTA process, another process is being handled yet")
            return;
        }

        // ================ oke, main logic ===================

        this._logger?.log("Start OTA Process: Sending firm to Device Service")

        // switch current ota step
        this._otaCurrentStep = OtaProcess.DOWNLOADING_FIRM
        this._currentDeviceMAC = message.device_id
        this._currentDownloadFirmMsgID = message.message_id


        const msgToSendDS: IEventMsg = {
            id: message.message_id,
            content: message
        }

        this._tcpDSListener.send(JSON.stringify(msgToSendDS.content))

        this.sendMsgToTargetWindow({
            process: this._otaCurrentStep
        })


    }

    _resetOTAProcess() {
        this._currentDeviceMAC = ""
        this._currentDownloadFirmMsgID = ""
        this._otaCurrentStep = OtaProcess.NONE
        this.sendMsgToTargetWindow({
            status: 0,
            process: OtaProcess.NONE
        })
    }

}

export const otaController = new OTAController();

