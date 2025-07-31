

import { Alert, Button, CircularProgress, Divider, FormControl, FormControlLabel, FormGroup, IconButton, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, Stack, Switch, Tooltip, Typography } from "@mui/material";

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useEffect, useState } from "react";
import { IReportRelayMsg } from "@/ipc-shared/IReportRelayMsg";
import { ISetRelayMsg } from "@/ipc-shared/ISetRelayMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { v4 as uuidv4 } from 'uuid';
import { disable } from "colors";
import { OtaTextFileUploadButton } from "./OtaTextFileUploadButton";
import { OtaBinFileUploadButton } from "./OtaBinFileUploadButton";

/**
 * Control bar on the top, has many tool, usually to interract with selected device
 * @param param0 
 * @returns 
 */
export const Controls = (
    {
        availableDeviceMacs,
        onSelectDevice,
        selectedDeviceMac
    }: {
        availableDeviceMacs: string[]
        onSelectDevice?: (deviceId: string) => void,
        selectedDeviceMac: string
    }
) => {

    const [lively, setLively] = useState(true);
    // const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
    // const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
    const [relay1, setRelay1] = useState<boolean>(false);
    const [relay2, setRelay2] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);


    const [noti, setNoti] = useState<string>("")

    useEffect(() => {
        if (onSelectDevice) onSelectDevice(selectedDeviceMac);
    }, [selectedDeviceMac])

    useEffect(() => {

        bindIPCListeners();

        return () => {
            removeIPCListeners();
        }
    }, [])


    useEffect(() => {
        ipcSendRelayRequest();
    }, [relay1, relay2])





    /**
     * Listen for relay report from ipc main, change the relay switch component if device_id matched 
     */
    const bindIPCListeners = () => {
        window.ipcRenderer.onRelayEvent((_, relayReport: IReportRelayMsg) => {
            
            /// guard device id
            if (!relayReport.device_id) {
                console.log("Error relayReport Format, check the JSON received from IPC Main");
                console.log("relayreport: ", relayReport)
                return;
            }

            /// guard device id
            if (relayReport.device_id !== selectedDeviceMac) {
                return;
            }

            /// end guard device id

            /// guard undefined relay state
            if (relayReport.relays === undefined || relayReport.relays.length < 2) {
                console.log("Error relayReport format")
                console.log("relay report: ", relayReport)
            }
            /// end guard

            setRelay1(relayReport.relays[0].state === 1)
            relayReport.relays[1] && setRelay2(relayReport.relays[1].state === 1)



        })


    }

    const removeIPCListeners = () => {
        window.ipcRenderer.removeAllListener();
    }

    const ipcSendRelayRequest = () => {

        const msg: ISetRelayMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.SET_RELAY,
            device_id: selectedDeviceMac,
            relays: [
                {
                    "relay_id": 0,         // required. ID/Chỉ số của Relay. Hiện tại có 2 Relay nên sẽ có ID là 0 hoặc 1
                    "state": relay1 ? 1 : 0,            // required. Có 2 giá trị: 
                },
                {
                    "relay_id": 1,
                    "state": relay2 ? 1 : 0,
                }
            ],

        }

        window.ipcRenderer.sendSetRelayMsg(msg)
    }

    return <FormGroup >
        <Stack direction="row" className="items-center flex flex-row">



            {/* <Typography alignContent={"center"} className="px-2">
                <Tooltip title="Lỗi server !" placement="top" className="">
                    <ErrorOutlineRoundedIcon color="error" />
                </Tooltip>

            </Typography>





            <Typography alignContent={"center"} className="px-2">
                <Tooltip title="Đã kết nối" placement="top" className="">
                    <CheckCircleRoundedIcon color="success" />
                </Tooltip>

            </Typography> */}




            <FormControl className="w-2/12" >
                <InputLabel id="demo-simple-select-label">Thiết bị</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={selectedDeviceMac}
                    label="Thiết bị"
                    onChange={(e: SelectChangeEvent<string>, _) => {
                        if (onSelectDevice) onSelectDevice(e.target.value)
                        // setCurrentDeviceId(e.target.value);
                    }}
                >
                    {availableDeviceMacs.map((device: string, index: number) => {
                        return <MenuItem value={device} key={index}>{device}</MenuItem>
                    }
                    )}

                    {/* <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem> */}
                </Select>
            </FormControl>

            <Divider variant="middle" />

            {(selectedDeviceMac != "") && <Typography alignContent={"center"} className="w-2/12">ID Thiết bị: {selectedDeviceMac}</Typography>}
            {(selectedDeviceMac == "") && <Typography alignContent={"center"} className="text-red-600 w-2/12">Chọn 1 thiết bị</Typography>}


            {/* <FormControlLabel control={<Switch checked={lively} onChange={(_, checked: boolean) => {
            setLively(checked);
        }} />} label="Tự động" /> */}


            <Divider variant="middle" />
            {/* <FormGroup > */}
            {/* <Stack direction={"row"} alignContent={"center"}> */}

            <FormControlLabel control={<Switch value={relay1}

                checked={relay1}
                onChange={(_, checked: boolean) => setRelay1(checked)}

                disabled={!selectedDeviceMac}
            />} label="Rơ le 1" />

            <FormControlLabel control={<Switch
                value={relay2}
                checked={relay2}
                onChange={(_, checked: boolean) => setRelay2(checked)}

                disabled={!selectedDeviceMac}
            />} label="Rơ le 2" />






            {/* </Stack> */}


            {/* <Tooltip title={"Cập nhật"} placement="top">
                <IconButton aria-label="update" onClick={() => {
                    if (onReloadTable) {
                        onReloadTable();
                    }
                }} className="">
                    <CachedRoundedIcon color="primary" />
                </IconButton>
            </Tooltip> */}
           {selectedDeviceMac && <div className="w-4/12">
                <OtaBinFileUploadButton
                    deviceMAC={selectedDeviceMac}
                />
            </div>}


            {/* </FormGroup> */}

            <Typography alignContent={"center"} className="px-2">

                {loading && <CircularProgress className="" />}
            </Typography>

        </Stack>

        {
            (noti !== "") &&
            <Snackbar
                open={true}
                autoHideDuration={6000}
                onClose={() => { setNoti("") }}

            >
                <Alert
                    // onClose={handleClose}
                    severity="error"
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {noti}
                </Alert>
            </Snackbar>
        }

    </FormGroup>
}