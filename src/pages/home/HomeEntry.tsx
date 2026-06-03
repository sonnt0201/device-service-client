import { useEffect, useState } from "react";
import ScreenDisplay from "./ScreenDisplay";
import { Controls } from "./Controls";
import { Paper, Stack } from "@mui/material";
import BillsTable from "./BillsTable";
import { IEncodedLog } from "@/ipc-shared/Log";
import { IReportPresetMsg } from "@/ipc-shared/IReportPresetMsg";
import { Keyboard_Seen } from "@/components/ui/Keyboard_Seen";
import { IKeyboardButtonPressMsg } from "@/ipc-shared/IKeyboardButtonPressMsg";
import { IReportKeyboardButtonsPressedMsg } from "@/ipc-shared/IReportKeyboardButtonsPressedMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { v4 as uuidv4 } from 'uuid';
import { ScreenButtonHistoryLog } from "@/components/ScreenButtonHistoryLog";
import { CommunicationMessageLog } from "@/components/CommunicationMessageLog";
import { IDeviceServiceDevice } from "@/ipc-shared/IDeviceServiceDevice";


/// post-fix "Entry" as a convention for entry point components of current page
export const HomeEntry = () => {


  const [totalCost, setTotalCost] = useState("_");
  const [fuelVolume, setFuelVolume] = useState("_");
  const [fuelUnitPrice, setFuelUnitPrice] = useState("_");

  const [keyboardScreenText, setKeyboardScreenText] = useState<string>("");

  const [gasLogs, setGasLogs] = useState<Set<IEncodedLog | IReportPresetMsg>>(new Set());

  const [availableDevices, setAvailableDevices] = useState<IDeviceServiceDevice[]>([]);

  const [selectedDeviceMac, setSelectedDeviceMac] = useState<string>("");

  const [recentPressedButtonsByDevice, setRecentPressedButtonsByDevice] = useState<Record<string, { buttonId: number; timestamp: number }[]>>({});

  useEffect(() => {
    const applyDevices = (devices: IDeviceServiceDevice[]) => {
      const validDevices = devices.filter((device) => !!device?.device_id);
      setAvailableDevices(validDevices);
    };

    window.ipcRenderer.onDevices((_, devices) => {
      applyDevices(devices);
    });

    window.ipcRenderer.getCachedDevices?.()
      .then((devices) => applyDevices(devices))
      .catch(() => undefined);

    window.ipcRenderer.onRealtimeScreenMsg((_, msg) => {
      if (msg.screen
        //  && selectedDeviceMac === msg.screen.deviceId

      ) {
        // console.log(msg.screen)
        setTotalCost(msg.screen.screen[0]);
        setFuelVolume(msg.screen.screen[1]);
        setFuelUnitPrice(msg.screen.screen[2]);
      }

      // Handle keyboard screen data if present
      if (msg.keyboard_screen) {
        setKeyboardScreenText(msg.keyboard_screen.keyboard_screen.join("\n"));
      }
    })

    window.ipcRenderer.onKeyboardButtonsPressedMsg((_, msg: IReportKeyboardButtonsPressedMsg) => {
      const normalizedButtons = msg.button_actions
        .flatMap((action) => action.button_list.map((buttonId) => ({
          buttonId,
          timestamp: action.timestamp,
        })))
        .filter((item) => Number.isInteger(item.buttonId));

      if (normalizedButtons.length === 0) return;

      setRecentPressedButtonsByDevice((prev) => {
        const current = prev[msg.device_id] ?? [];
        const next = [...normalizedButtons, ...current]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);

        return {
          ...prev,
          [msg.device_id]: next,
        };
      });
    });

    window.ipcRenderer.onLogEvent((_, gasLog: IEncodedLog) => {
      setGasLogs(prevLogs => new Set([...prevLogs, gasLog]));
      // console.log(gasLog)
    })

    window.ipcRenderer.onPresetEvent((_, preset: IReportPresetMsg) => {
      setGasLogs(prevLogs => new Set([...prevLogs, preset]));
    });

    return () => {
      window.ipcRenderer.removeAllListener()
    };
  }, [])

  useEffect(() => {
    if (availableDevices.length === 0) {
      if (selectedDeviceMac !== "") setSelectedDeviceMac("");
      return;
    }

    if (selectedDeviceMac === "") {
      setSelectedDeviceMac(availableDevices[0].device_id);
      return;
    }

    const hasSelected = availableDevices.some((device) => device.device_id === selectedDeviceMac);
    if (!hasSelected) {
      setSelectedDeviceMac(availableDevices[0].device_id);
    }

    // console.log("Available devices: ", availableDevices);
  }, [availableDevices, selectedDeviceMac]);

  const handleKeyboardButtonPress = (buttonId: number) => {
    if (!selectedDeviceMac) return;

    const msg: IKeyboardButtonPressMsg = {
      message_id: uuidv4(),
      message_type: MsgTypeValue.KEYBOARD_PRESS_VIRTUAL_BUTTONS,
      device_id: selectedDeviceMac,
      button_list: [buttonId],
    };

    window.ipcRenderer.sendKeyboardButtonPressMsg?.(msg);
  };



  return (

    <div className="home flex flex-col items-center justify-center">
      <Paper className="w-full" >
        <Controls
          availableDeviceMacs={availableDevices.map((device) => device.device_id)}
          selectedDeviceMac={selectedDeviceMac}
          onSelectDevice={(deviceId: string) => {
            setSelectedDeviceMac(deviceId);
            setTotalCost("_");
            setFuelVolume("_");
            setFuelUnitPrice("_");
          }}
        />
      </Paper>

      <Stack direction={"row"} spacing={3} className="w-12/12 mx-auto align-center my-4 bg-red-0" alignItems="flex-start">

        <Paper className="w-6/12">
          <Keyboard_Seen
            lcdText={keyboardScreenText || "SEEN"}
            selectedDeviceMac={selectedDeviceMac}
            onKeyPress={handleKeyboardButtonPress}
            recentPressedButtons={recentPressedButtonsByDevice[selectedDeviceMac] ?? []}
          />
        </Paper>

        <Paper elevation={12} className="w-2/12">
          <ScreenDisplay totalCost={totalCost} fuelVolume={fuelVolume} fuelUnitPrice={fuelUnitPrice} />
        </Paper>

        <Paper className="w-5/12 h-20 mx-auto my-4">
          <BillsTable rows={Array.from(gasLogs).filter(log => log.device_id == selectedDeviceMac)} />
        </Paper>
      </Stack>


      <Paper elevation={4} className="w-full mt-4">
        <ScreenButtonHistoryLog selectedDeviceMac={selectedDeviceMac} />
      </Paper>

         <CommunicationMessageLog />

      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} marginY={2}>

        {/* <Paper elevation={4} className="w-8/12"> */}
     
        {/* </Paper> */}

      </Stack>

    </div>



  );
}