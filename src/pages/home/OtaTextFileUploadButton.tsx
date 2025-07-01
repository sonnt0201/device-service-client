import { Button, Stack, Typography } from "@mui/material"
import { useEffect, useState } from "react"

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
    useEffect(() => {

        window.ipcRenderer.onOtaMsg((_, msg) => {

        })

        return () => {
            window.ipcRenderer.removeAllListener()
        }
    }, [])


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

    return (
        <Stack direction={"row"}>

            <Button
                variant="contained"
                component="label"
                sx={{ height: 40, ml: 2 }}
                disabled={disableOTA}
            >
                {firmFileName ? "Upload firmware" : "Start firmware updating"}
                <input
                    type="file"
                    hidden
                    accept=".txt"
                    onChange={handleFileChange}
                />
            </Button>


            {
                firmFileName && <Button
                    variant="outlined"
                    color="error"

                >
                    Hủy
                </Button>
            }


            {

                firmFileName && <Typography
                    alignContent={"center"}
                    className="w-3/12"
                >{firmFileName}</Typography>

            }
            
        </Stack>
    )
}