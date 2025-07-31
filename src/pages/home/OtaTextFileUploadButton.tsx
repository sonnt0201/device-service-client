import { IDownloadFirmMsg } from "@/ipc-shared/IDownloadFirmMsg"
import { OtaStatusValue } from "@/ipc-shared/IOtaStatus";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { OtaProcess } from "@/ipc-shared/OtaProcess";
import { Button, Stack, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import { v4 as uuidv4 } from 'uuid';
/**
 * OTA upload button allow uploading txt file
 * 
 * all OTA codes logic for renderer-side are put here
 */
export const OtaTextFileUploadButton = (
    {
        deviceMAC
    }:
        {
            deviceMAC?: string
        }
) => {

    const [disableOTA, setDisableOTA] = useState<boolean>(false)
    const [firmFileName, setFirmFileName] = useState<string>("");
    const [firmText, setFirmText] = useState<string>("") // store txt-format firmware (including base64-encoded 2 firm files) 
    const [otaStatusValue, setOtaStatusValue] = useState<OtaStatusValue>(OtaStatusValue.SUCCESS);
    const [process, setProcess] = useState<OtaProcess>(OtaProcess.NONE)
    
    useEffect(() => {

        window.ipcRenderer.onOtaMsg((_, msg) => {
            console.log("OTA: Receive from IPC MAIN")
            setOtaStatusValue(msg.status)
            setProcess(msg.process)
        })

        // return () => {
        //     window.ipcRenderer.removeAllListener()
        // }
    }, [])

    useEffect(() => {

        console.log("OTA - Status Value: ", otaStatusValue)
        console.log("OTA - Ongoing Process: ", process)

      setDisableOTA(!deviceMAC || process !== OtaProcess.NONE)
    },[deviceMAC, otaStatusValue, process])

/**
 * start to send txt firm file to ipc main via `ota` channel
 */
    const startOTA = () => {

        if (!deviceMAC || !firmText){
            console.log("No device or firm file selected")
            return;
        
        }

        

        const downloadfirmmsg : IDownloadFirmMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.DOWNLOAD_FIRM,
            device_id: deviceMAC,
            file: firmText
        }

        console.log("Start sending firm text")

        window.ipcRenderer.sendOtaFirmware(downloadfirmmsg)

    }


    const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {

        if (!event.target.files) return;

        const file = event.target.files[0];
        if (!file) return;

        // Check file extension if needed
        if (!file.name.endsWith(".txt")) {
            console.error("Please upload a .txt file");
            return;
        }

        try {
            const text = await file.text(); // Reads file as string

            setFirmFileName(file.name)
            setFirmText(text);

            console.log("File content length:", text.length);

            // Send to Electron main process via IPC
            // window.ipcRenderer.send("ota-upload-text", text);

        } catch (err) {
            console.error("Failed to read file", err);
        }
    };

    const cancelFileUploaded = () => {
        setFirmFileName("")
        setFirmText("")
    }

    return (
        <Stack direction={"row"}>

            {!firmFileName && <Button
                id="button: upload txt firm file"
                variant="contained"
                component="label"
                sx={{ height: 40, ml: 2 }}
                disabled={disableOTA}

            >
                Upload firmware
                <input
                    type="file"
                    hidden
                    accept=".txt"
                    onChange={handleFileChange}
                />
            </Button> }

            {
                firmFileName &&
                <Button
                id="button: start ota"
                variant="contained"
                component="label"
                sx={{ height: 40, mx: 2}}
                disabled={disableOTA}

                onClick={() => startOTA()}

            > Cập nhật </Button>
            }


            {
                firmFileName && <Button
                    variant="outlined"
                    color="error"
                    disabled={disableOTA}
                    onClick={() => cancelFileUploaded()}

                >
                    Hủy
                </Button>
            }


            {

                firmFileName && <Typography
                    alignContent={"center"}
                    sx={{mx: 2}}
                >{firmFileName}</Typography>

            }

        </Stack>
    )
}