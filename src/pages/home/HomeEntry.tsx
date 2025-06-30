import { useEffect, useState } from "react";
import ScreenDisplay from "./ScreenDisplay";
import { Controls } from "./Controls";
import { Paper, Stack } from "@mui/material";
import BillsTable from "./BillsTable";
import { IEncodedLog } from "electron/ipc-shared/Log";


/// post-fix "Entry" as a convention for entry point components of current page
export const HomeEntry = () => {


  const [totalCost, setTotalCost] = useState("_");
  const [fuelVolume, setFuelVolume] = useState("_");
  const [fuelUnitPrice, setFuelUnitPrice] = useState("_");

  const [gasLogs, setGasLogs] = useState<Set<IEncodedLog>>(new Set<IEncodedLog>());

  const [availableDeviceMacs, setAvailableDeviceMacs] = useState<Set<string>>(new Set<string>());

  const [selectedDeviceMac, setSelectedDeviceMac] = useState<string>("");

  useEffect(() => {
    window.ipcRenderer.onRealtimeScreenMsg((_, msg) => {
      if (!msg.screen) return;


      if (selectedDeviceMac !== msg.screen.deviceId) {
        setTotalCost(msg.screen.screen[0]);
        setFuelVolume(msg.screen.screen[1]);
        setFuelUnitPrice(msg.screen.screen[2]);

      }





      const deviceMac = msg.screen.deviceId;
      if (deviceMac && !availableDeviceMacs.has(deviceMac)) {


        setAvailableDeviceMacs(prevMacs => new Set([...prevMacs, deviceMac]));


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
    if (availableDeviceMacs.size > 0 && selectedDeviceMac === "") {
      setSelectedDeviceMac(Array.from(availableDeviceMacs)[0]);
    }

    // console.log("Available device MACs: ", availableDeviceMacs);
  }, [availableDeviceMacs, selectedDeviceMac]);



  return (

    <div className="home flex flex-col items-center justify-center">
      <Paper className="w-10/12 p-1" >
        <Controls
          availableDeviceMacs={Array.from(availableDeviceMacs)}
          selectedDeviceMac={selectedDeviceMac}
          onSelectDevice={(deviceId: string) => {
            setSelectedDeviceMac(deviceId);
            setTotalCost("_");
            setFuelVolume("_");
            setFuelUnitPrice("_");
          }}
        />
      </Paper>

      <Stack direction={"row"} spacing={3} className="w-10/12 mx-auto my-4">

        <Paper elevation={12} className="w-5/12 mx-auto my-4" >
          <ScreenDisplay totalCost={totalCost} fuelVolume={fuelVolume} fuelUnitPrice={fuelUnitPrice} />
        </Paper>


        <Paper className="w-8/12 h-20 mx-auto my-4">
          <BillsTable rows={Array.from(gasLogs).filter(log => log.device_id == selectedDeviceMac)} />

        </Paper>
      </Stack>
    </div>



  );
}