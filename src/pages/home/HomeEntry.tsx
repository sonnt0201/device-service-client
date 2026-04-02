import { useEffect, useState } from "react";
import ScreenDisplay from "./ScreenDisplay";
import { Controls } from "./Controls";
import { Paper, Stack } from "@mui/material";
import BillsTable from "./BillsTable";
import { IEncodedLog } from "@/ipc-shared/Log";
import { Keyboard_Seen } from "@/components/ui/Keyboard_Seen";
import { IKeyboardButtonPressMsg } from "@/ipc-shared/IKeyboardButtonPressMsg";
import { MsgTypeValue } from "@/ipc-shared/MessageType";
import { v4 as uuidv4 } from 'uuid';
import { CommunicationMessageLog } from "@/components/CommunicationMessageLog";
import { IDeviceServiceDevice } from "@/ipc-shared/IDeviceServiceDevice";


/// post-fix "Entry" as a convention for entry point components of current page
export const HomeEntry = () => {


  const [totalCost, setTotalCost] = useState("_");
  const [fuelVolume, setFuelVolume] = useState("_");
  const [fuelUnitPrice, setFuelUnitPrice] = useState("_");

  const [keyboardScreenText, setKeyboardScreenText] = useState<string>("");

  const [gasLogs, setGasLogs] = useState<Set<IEncodedLog>>(new Set<IEncodedLog>());

  const [availableDevices, setAvailableDevices] = useState<IDeviceServiceDevice[]>([]);

  const [selectedDeviceMac, setSelectedDeviceMac] = useState<string>("");

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
      if (msg.screen && selectedDeviceMac !== msg.screen.deviceId) {
        setTotalCost(msg.screen.screen[0]);
        setFuelVolume(msg.screen.screen[1]);
        setFuelUnitPrice(msg.screen.screen[2]);
      }

      // Handle keyboard screen data if present
      if (msg.keyboard_screen) {
        setKeyboardScreenText(msg.keyboard_screen.keyboard_screen);
      }
    })

    window.ipcRenderer.onLogEvent((_, gasLog: IEncodedLog) => {
      setGasLogs(prevLogs => new Set([...prevLogs, gasLog]));
      // console.log(gasLog)
    })

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
      <Paper className="w-full p-1" >
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
          />
        </Paper>

        <Paper elevation={12} className="w-2/12">
          <ScreenDisplay totalCost={totalCost} fuelVolume={fuelVolume} fuelUnitPrice={fuelUnitPrice} />
        </Paper>

        <Paper className="w-5/12 h-20 mx-auto my-4">
          <BillsTable rows={Array.from(gasLogs).filter(log => log.device_id == selectedDeviceMac)} />
        </Paper>
      </Stack>

      <CommunicationMessageLog />
    </div>



  );
}