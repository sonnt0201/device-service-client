import { IDownloadFirmMsg } from "@/ipc-shared/IDownloadFirmMsg";
import { OtaStatusValue } from "@/ipc-shared/IOtaStatus";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { OtaProcess } from "@/ipc-shared/OtaProcess";
import { Stack, Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
async function calculateSHA256(buffer: ArrayBuffer): Promise<ArrayBuffer> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return hashBuffer;
}

async function processFirmwareFile(file: File): Promise<string> {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Calculate SHA256 hash
    const hashBuffer = await calculateSHA256(arrayBuffer);

    // Append hash to original content
    const combined = new Uint8Array(arrayBuffer.byteLength + hashBuffer.byteLength);
    combined.set(new Uint8Array(arrayBuffer), 0);
    combined.set(new Uint8Array(hashBuffer), arrayBuffer.byteLength);

    // Convert combined data to Base64
    const binaryString = String.fromCharCode(...combined);
    const base64String = btoa(binaryString);

    return base64String;
}

export const OtaBinFileUploadButton = ({
    deviceMAC
}:
    {
        deviceMAC?: string
    }) => {


    const [disableOTA, setDisableOTA] = useState<boolean>(false)
    const [firmFileName, setFirmFileName] = useState<string>("");
    const [firmText, setFirmText] = useState<string>("") // store txt-format firmware (including base64-encoded 2 firm files) 
    const [otaStatusValue, setOtaStatusValue] = useState<OtaStatusValue>(OtaStatusValue.SUCCESS);
    const [process, setProcess] = useState<OtaProcess>(OtaProcess.NONE)

    useEffect(() => {

        window.ipcRenderer.onOtaMsg((_, msg) => {
            console.log("OTA: Receive from IPC MAIN")

            if (process === OtaProcess.ACTIVATING_FIRM && msg.process === OtaProcess.NONE) {
                // firmware update successfully
                
                resetOta()
            }

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
    }, [deviceMAC, otaStatusValue, process])


    const handleFilesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files) return;

        const file1 = event.target.files[0];
        if (!file1) return;

        // Check file extension if needed
        if (!file1.name.endsWith(".bin")) {
            console.error("Please upload a .bin file");
            return;
        }

        setFirmFileName(file1.name)

        try {
            console.log("Start encode file to base64")
            const file1Base64 = await processFirmwareFile(file1);
            const file2Base64 = file1Base64

            // Create JSON object with both base64 strings
            const firmwareJson = {
                file1: file1Base64,
                file2: file2Base64,
            };

            // Convert JSON to string and then to Base64
            const jsonString = JSON.stringify(firmwareJson);
            const jsonBase64 = btoa(jsonString);

            console.log("Complete base64 string encode")

            setFirmText(jsonBase64);
        } catch (error) {
            console.error("Error processing files:", error);
        }
    };

    /**
 * start to send txt firm file to ipc main via `ota` channel
 */
    const startOTA = () => {

        if (!deviceMAC || !firmText) {
            console.log("No device or firm file selected")
            return;

        }



        const downloadfirmmsg: IDownloadFirmMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.DOWNLOAD_FIRM,
            device_id: deviceMAC,
            file: firmText
        }

        console.log("Start sending firm text")

        window.ipcRenderer.sendOtaFirmware(downloadfirmmsg)

    }


    const cancelFileUploaded = () => {
        setFirmFileName("")
        setFirmText("")
        setProcess(OtaProcess.NONE)
    }

    function downloadTextFile(content: string, filename: string) {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);



        const txtFilename = filename.replace(/\.bin$/i, ".txt");

        const a = document.createElement("a");
        a.href = url;
        a.download = txtFilename;
        a.click();

        URL.revokeObjectURL(url); // Clean up
    }

    const resetOta = () => {
        setFirmFileName("")
        setFirmText("")

    }

    return (
        <Stack direction={"row"}>

            {!firmFileName && <Button
                id="button: upload bin firm file"
                variant="contained"
                component="label"
                sx={{ height: 40, ml: 2 }}
            // disabled={disableOTA}

            >
                Upload firmware
                <input
                    type="file"
                    hidden
                    accept=".bin"
                    onChange={handleFilesUpload}
                />
            </Button>}

            {
                firmFileName &&
                <Button
                    id="button: start ota with bin file"
                    variant="contained"
                    component="label"
                    sx={{ height: 40, mx: 1 }}
                    disabled={disableOTA}

                    onClick={() => startOTA()}

                > {process === OtaProcess.NONE && "Cập nhật"   } 
                {process === OtaProcess.DOWNLOADING_FIRM && "Gửi firmware ..."}
                {process === OtaProcess.ACTIVATING_FIRM && "Kích hoạt firmware ..."}
                </Button>
            }

            {
                firmFileName && process === OtaProcess.NONE &&
                <Button
                    id="button: download final base64 content file"
                    variant="outlined"
                    component="label"
                    sx={{ height: 40, mx: 1 }}
                    disabled={disableOTA}

                    onClick={() => downloadTextFile(firmText, firmFileName)}

                > Tải File Base64  </Button>
            }


            {
                firmFileName && <Button
                    variant="outlined"
                    color="error"
                    // disabled={disableOTA}
                    sx={{
                        mx: 1
                    }
                    }
                    onClick={() => cancelFileUploaded()}

                >
                    Hủy
                </Button>
            }


            {

                firmFileName && <Typography
                    alignContent={"center"}
                    color="success"
                    sx={{ mx: 2 }}
                >{firmFileName}</Typography>

            }

        </Stack>
    )
}