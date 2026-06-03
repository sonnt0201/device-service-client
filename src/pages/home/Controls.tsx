

import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { IReportRelayMsg } from "@/ipc-shared/IReportRelayMsg";
import { ISetRelayMsg } from "@/ipc-shared/ISetRelayMsg";
import { ISetKeyboardModeMsg } from "@/ipc-shared/ISetKeyboardModeMsg";
import { IReportKeyboardModeMsg } from "@/ipc-shared/IReportKeyboardModeMsg";
import { ISetPresetMsg } from "@/ipc-shared/ISetPresetMsg";
import { IPresetStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { v4 as uuidv4 } from 'uuid';
import { OtaTextFileUploadButton } from "./OtaTextFileUploadButton";
import { OtaBinFileUploadButton } from "./OtaBinFileUploadButton";
import { LocalGasStationRounded } from "@mui/icons-material";

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

    // const [currentDeviceId, setCurrentDeviceId] = useState<string>("");
    // const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
    const [relay1, setRelay1] = useState<boolean>(false);
    const [relay2, setRelay2] = useState<boolean>(false);
    const [keyboardMode, setKeyboardMode] = useState<"physical" | "virtual">("physical");
    const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
    const [presetType, setPresetType] = useState<"cost" | "volume">("cost");
    const [presetValue, setPresetValue] = useState<string>("");
    const [presetStatusByDevice, setPresetStatusByDevice] = useState<Record<string, IPresetStatusMsg>>({});

    const [loading, setLoading] = useState<boolean>(false);


    const [noti, setNoti] = useState<string>("")

    const selectedDeviceMacRef = useRef(selectedDeviceMac);

    useEffect(() => {
        selectedDeviceMacRef.current = selectedDeviceMac;
    }, [selectedDeviceMac]);

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

    useEffect(() => {
        ipcSendKeyboardModeRequest();
    }, [keyboardMode, selectedDeviceMac]);

    useEffect(() => {
        if (!selectedDeviceMac) return;

        window.ipcRenderer.getKeyboardMode?.(selectedDeviceMac)
            .then((msg) => {
                if (!msg) return;
                if (msg.device_id !== selectedDeviceMac) return;
                setKeyboardMode(msg.mode);
            })
            .catch(() => undefined);
    }, [selectedDeviceMac]);





    /**
     * Listen for relay report from ipc main, change the relay switch component if device_id matched 
     */
    const bindIPCListeners = () => {
        window.ipcRenderer.onRelayEvent((_, relayReport: IReportRelayMsg) => {
            const currentDeviceMac = selectedDeviceMacRef.current;
            
            /// guard device id
            if (!relayReport.device_id) {
                console.log("Error relayReport Format, check the JSON received from IPC Main");
                console.log("relayreport: ", relayReport)
                return;
            }

            /// guard device id
            if (relayReport.device_id !== currentDeviceMac) {
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

        window.ipcRenderer.onKeyboardModeMsg?.((_, modeReport: IReportKeyboardModeMsg) => {
            const currentDeviceMac = selectedDeviceMacRef.current;
            if (!modeReport.device_id || modeReport.device_id !== currentDeviceMac) return;
            if (modeReport.mode === "physical" || modeReport.mode === "virtual") {
                setKeyboardMode(modeReport.mode);
            }
        })

        window.ipcRenderer.onPresetStatus?.((_, status: IPresetStatusMsg) => {
            if (!status.device_id) return;
            setPresetStatusByDevice((prev) => ({
                ...prev,
                [status.device_id as string]: status,
            }));
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

    const ipcSendKeyboardModeRequest = () => {
        if (!selectedDeviceMac) return;

        const msg: ISetKeyboardModeMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.SET_KEYBOARD_MODE,
            device_id: selectedDeviceMac,
            mode: keyboardMode,
        }

        window.ipcRenderer.sendSetKeyboardModeMsg?.(msg)
    }

    const ipcSendPresetRequest = (payload: { pre_cost?: number; pre_volume?: number }) => {
        if (!selectedDeviceMac) return;

        const msg: ISetPresetMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.REQUEST_PRESET,
            device_id: selectedDeviceMac,
            ...payload,
        };

        window.ipcRenderer.sendPresetRequest?.(msg);
    };

    const presetStatus = selectedDeviceMac ? presetStatusByDevice[selectedDeviceMac] : undefined;
    const presetSeverity = (status?: string) => {
        switch (status) {
            case "received":
                return "info";
            case "busy":
                return "warning";
            case "error":
                return "error";
            case "done":
                return "success";
            default:
                return "info";
        }
    };

    const presetMeta = presetStatus?.meta?.toString().trim();

    const handleOpenPresetModal = (type: "cost" | "volume") => {
        setPresetType(type);
        setPresetValue("");
        setPresetModalOpen(true);
    };

    const handleSubmitPreset = () => {
        const value = Number(presetValue);
        if (!Number.isFinite(value)) return;

        if (presetType === "cost") {
            ipcSendPresetRequest({ pre_cost: value });
        } else {
            ipcSendPresetRequest({ pre_volume: value });
        }

        setPresetModalOpen(false);
    };

    return <FormGroup >
        <Stack direction="row" className="items-center flex flex-row">

        {/* <LocalGasStationRounded /> */}


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




            <FormControl className="w-2/12" sx={{marginX: 2}}  >
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

            {(selectedDeviceMac != "") && <Typography alignContent={"start"} 
            className="w-2/12"
            >ID: {selectedDeviceMac}</Typography>}
            {(selectedDeviceMac == "") && <Typography alignContent={"start"} className="text-red-600 w-1/12">Chọn 1 thiết bị</Typography>}


            {/* <FormControlLabel control={<Switch checked={lively} onChange={(_, checked: boolean) => {
            setLively(checked);
        }} />} label="Tự động" /> */}


            <Divider variant="middle" />
            {/* <FormGroup > */}
            {/* <Stack direction={"row"} alignContent={"center"}> */}
            <Paper className="w-3/12" elevation={0} >
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


            </Paper>
            
            <Stack direction="row" alignItems="center" spacing={2} marginX={3} className="w-3/12">
                <InputLabel >Bàn phím</InputLabel>
                <ToggleButtonGroup
                    // size="small"
                    exclusive
                    value={keyboardMode}
                    onChange={(_, nextMode: "physical" | "virtual" | null) => {
                        if (nextMode) setKeyboardMode(nextMode)
                    }}
                    // disabled={!selectedDeviceMac}
                >
                    <ToggleButton value="physical"> vật lý</ToggleButton>
                    <ToggleButton value="virtual">ảo hóa </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack direction="row" alignItems="flex-start" spacing={1} marginRight={2} 
           className="w-3/12"
            >
                <Button
                    variant="contained"
                    onClick={() => handleOpenPresetModal("cost")}
                    disabled={!selectedDeviceMac}
                    startIcon={<LocalGasStationRounded />}
                    className="w-8/12"
                >
                    đặt bơm
                </Button>
                {presetStatus && presetStatus.status && (
                    <Tooltip title={presetMeta || ""} disableHoverListener={!presetMeta}>
                        <Chip
                            label={`Preset: ${presetStatus.status}`}
                            color={presetSeverity(presetStatus.status)}
                            variant="outlined"
                        />
                    </Tooltip>
                )}
            </Stack>


           {selectedDeviceMac && <div className="w-3/12">
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

        <Dialog open={presetModalOpen} onClose={() => setPresetModalOpen(false)} fullWidth maxWidth="xs">
            <DialogTitle>Preset</DialogTitle>
            <DialogContent>
                <Stack spacing={2} marginTop={1}>
                    <FormControl fullWidth>
                        <InputLabel id="preset-type-label">Type</InputLabel>
                        <Select
                            labelId="preset-type-label"
                            value={presetType}
                            label="Type"
                            onChange={(e: SelectChangeEvent<string>) => {
                                const next = e.target.value === "volume" ? "volume" : "cost";
                                setPresetType(next);
                            }}
                        >
                            <MenuItem value="cost">Cost</MenuItem>
                            <MenuItem value="volume">Lit</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        autoFocus
                        label={presetType === "cost" ? "Cost" : "Lit"}
                        type="number"
                        fullWidth
                        value={presetValue}
                        onChange={(e) => setPresetValue(e.target.value)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPresetModalOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmitPreset} disabled={presetValue.trim() === ""}>
                    Send
                </Button>
            </DialogActions>
        </Dialog>

    </FormGroup>
}