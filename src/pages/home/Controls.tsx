

import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, FormGroup, InputLabel, MenuItem, Paper, Select, SelectChangeEvent, Snackbar, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { IReportRelayMsg } from "@/ipc-shared/IReportRelayMsg";
import { ISetRelayMsg } from "@/ipc-shared/ISetRelayMsg";
import { ISetKeyboardModeMsg } from "@/ipc-shared/ISetKeyboardModeMsg";
import { IReportKeyboardModeMsg } from "@/ipc-shared/IReportKeyboardModeMsg";
import { ISetPresetMsg } from "@/ipc-shared/ISetPresetMsg";
import { IKeyboardPresetStatusMsg, IKeyboardStatusMsg } from "@/ipc-shared/IPresetStatusMsg";
import { IStopBumpMsg } from "@/ipc-shared/IStopBumpMsg";
//* ============ PatchPlan 26-7-21 ========
import { describeKeyboardStatus, KeyboardMode, KeyboardStatusCode, MsgTypeValue } from "@/ipc-shared/MessageType";
// * =========== End PatchPlan 26-7-21  ========
//* ============ PatchPlan 26-8-11 ========
import { describePresetStatus } from "@/ipc-shared/MessageType";
import { StopCircleRounded } from "@mui/icons-material";
// * =========== End PatchPlan 26-8-11  ========
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
    //* ============ PatchPlan 26-7-21 ========
    // D3: "physical"/"virtual" -> "manu"/"auto" (Thủ công / Tự động)
    const [keyboardMode, setKeyboardMode] = useState<KeyboardMode>("manu");
    // * =========== End PatchPlan 26-7-21  ========
    const [presetModalOpen, setPresetModalOpen] = useState<boolean>(false);
    const [presetType, setPresetType] = useState<"cost" | "volume">("cost");
    const [presetValue, setPresetValue] = useState<string>("");
    //* ============ PatchPlan 26-8-11 ========
    /*
     * Chung 1 ô hiển thị cho mọi yêu cầu bàn phím (đặt preset / nhấn phím ảo / dừng bơm)
     * vì thiết bị chỉ chạy 1 việc một lúc (R4). Từ 11-08-2026, §15 Bán theo Preset đổi
     * hình dạng phản hồi thành {status, meta} trong khi §12/§16 vẫn {status_code,
     * error_message} - nên đây là union, phân biệt bằng `isPresetStatus` khi hiển thị.
     */
    const [keyboardStatusByDevice, setKeyboardStatusByDevice] =
        useState<Record<string, IKeyboardPresetStatusMsg | IKeyboardStatusMsg>>({});
    // * =========== End PatchPlan 26-8-11  ========

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

        //* ============ PatchPlan 26-7-21 ========
        window.ipcRenderer.onKeyboardModeMsg?.((_, modeReport: IReportKeyboardModeMsg) => {
            const currentDeviceMac = selectedDeviceMacRef.current;
            if (!modeReport.device_id || modeReport.device_id !== currentDeviceMac) return;
            // D3: manu/auto. D10: gói này giờ còn tự đến khi thiết bị kết nối
            // hoặc khi có người gạt công tắc trên máy, không chỉ khi ta vừa đặt mode.
            if (modeReport.mode === "manu" || modeReport.mode === "auto") {
                setKeyboardMode(modeReport.mode);
            }
        })

        window.ipcRenderer.onPresetStatus?.((_, status: IKeyboardPresetStatusMsg) => {
            if (!status.device_id) return;
            setKeyboardStatusByDevice((prev) => ({
                ...prev,
                [status.device_id as string]: status,
            }));
        })

        // D6: §12 Nhấn phím ảo giờ cũng có phản hồi cuối cùng. Dùng chung ô hiển thị
        // với preset vì cả hai đều là "yêu cầu bàn phím" và thiết bị chỉ chạy 1 việc
        // một lúc (R4: mỗi thiết bị chỉ có tối đa 1 yêu cầu đang chờ).
        window.ipcRenderer.onKeyboardPressStatus?.((_, status: IKeyboardStatusMsg) => {
            if (!status.device_id) return;
            setKeyboardStatusByDevice((prev) => ({
                ...prev,
                [status.device_id as string]: status,
            }));
        })
        // * =========== End PatchPlan 26-7-21  ========

        //* ============ PatchPlan 26-8-11 ========
        // §16 Dừng bơm: cùng hình dạng {status_code} như §12, dùng chung ô hiển thị.
        window.ipcRenderer.onStopBumpStatus?.((_, status: IKeyboardStatusMsg) => {
            if (!status.device_id) return;
            setKeyboardStatusByDevice((prev) => ({
                ...prev,
                [status.device_id as string]: status,
            }));
        })
        // * =========== End PatchPlan 26-8-11  ========
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

    //* ============ PatchPlan 26-8-11 ========
    const ipcSendStopBumpRequest = () => {
        if (!selectedDeviceMac) return;

        const msg: IStopBumpMsg = {
            message_id: uuidv4(),
            message_type: MsgTypeValue.STOP_BUMP,
            device_id: selectedDeviceMac,
        };

        window.ipcRenderer.sendStopBumpMsg?.(msg);
    };

    /** §15 dùng {status, meta}; §12/§16 dùng {status_code, error_message} - phân biệt bằng field `status`. */
    const isPresetStatus = (
        status: IKeyboardPresetStatusMsg | IKeyboardStatusMsg
    ): status is IKeyboardPresetStatusMsg => "status" in status;
    // * =========== End PatchPlan 26-8-11  ========

    const keyboardStatus = selectedDeviceMac ? keyboardStatusByDevice[selectedDeviceMac] : undefined;

    //* ============ PatchPlan 26-7-21 ========
    /*
     * D9: `status` (chuỗi) -> `status_code` (số) cho §10/§12/§16. §15 quay lại dùng chuỗi
     * từ 11-08-2026 (xem nhánh preset) - cả 2 nhánh đều map ra cùng 1 bộ severity.
     */
    const keyboardSeverity = (status?: IKeyboardPresetStatusMsg | IKeyboardStatusMsg) => {
        if (!status) return "info";

        if (isPresetStatus(status)) {
            switch (status.status) {
                case "done": return "success";
                case "busy": return "warning";
                case "received": return "info";
                case "error": return "error";
                default: return "info";
            }
        }

        switch (status.status_code) {
            case KeyboardStatusCode.OK:
                return "success";
            case KeyboardStatusCode.DEVICE_BUSY:
                return "warning";
            case KeyboardStatusCode.INVALID_REQUEST:
            case KeyboardStatusCode.DEVICE_DISCONNECTED:
            case KeyboardStatusCode.EXECUTION_ERROR:
                return "error";
            default:
                return "info";
        }
    };

    const keyboardStatusLabel = keyboardStatus
        ? (isPresetStatus(keyboardStatus)
            ? describePresetStatus(keyboardStatus.status)
            : describeKeyboardStatus(keyboardStatus.status_code))
        : "";

    const keyboardTooltip = keyboardStatus
        ? (isPresetStatus(keyboardStatus) ? keyboardStatus.meta : keyboardStatus.error_message)?.toString().trim()
        : undefined;
    // * =========== End PatchPlan 26-7-21  ========

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
        <Stack direction="row" spacing={1} alignItems="center" className="items-center flex flex-row" sx={{
            '& .MuiButtonBase-root, & .MuiTypography-root, & .MuiInputBase-root, & .MuiFormControlLabel-label, & .MuiInputLabel-root, & .MuiChip-label': {
                fontSize: '0.8125rem',
            },
        }}>

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




            <FormControl className="w-2/12" size="small" sx={{marginX: 1}}  >
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
                size="small"

            />} label="Rơ le 1" />

            <FormControlLabel control={<Switch
                value={relay2}
                checked={relay2}
                onChange={(_, checked: boolean) => setRelay2(checked)}

                disabled={!selectedDeviceMac}
                size="small"
            />} label="Rơ le 2" />


            </Paper>

            <Stack direction="row" alignItems="center" spacing={1} marginX={1} className="w-3/12">
                <InputLabel >Bàn phím</InputLabel>
                {/* //* ============ PatchPlan 26-7-21 ======== */}
                <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={keyboardMode}
                    onChange={(_, nextMode: KeyboardMode | null) => {
                        if (nextMode) setKeyboardMode(nextMode)
                    }}
                    // disabled={!selectedDeviceMac}
                >
                    {/* D3: tên chế độ theo LogiAPI 21-07-2026. "vật lý/ảo hóa" là tên của
                        cái mux CPLD, không phải tên chế độ bán mà API đang nói đến. */}
                    <ToggleButton value="manu">thủ công</ToggleButton>
                    <ToggleButton value="auto">tự động</ToggleButton>
                </ToggleButtonGroup>
                {/* // * =========== End PatchPlan 26-7-21  ======== */}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5} marginRight={1}
           className="w-3/12"
            >
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenPresetModal("cost")}
                    disabled={!selectedDeviceMac}
                    startIcon={<LocalGasStationRounded />}
                    className="w-8/12"
                >
                    đặt bơm
                </Button>
                {/* //* ============ PatchPlan 26-8-11 ======== */}
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={ipcSendStopBumpRequest}
                    disabled={!selectedDeviceMac}
                    startIcon={<StopCircleRounded />}
                    className="w-8/12"
                >
                    dừng bơm
                </Button>
                {/* // * =========== End PatchPlan 26-8-11  ======== */}
                {/* //* ============ PatchPlan 26-7-21 ======== */}
                {keyboardStatus && (
                    <Tooltip title={keyboardTooltip} disableHoverListener={!keyboardTooltip}>
                        <Chip
                            size="small"
                            label={`Bàn phím: ${keyboardStatusLabel}`}
                            color={keyboardSeverity(keyboardStatus)}
                            variant="outlined"
                        />
                    </Tooltip>
                )}
                {/* // * =========== End PatchPlan 26-7-21  ======== */}
            </Stack>


           {selectedDeviceMac && <div className="w-3/12 flex items-center">
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