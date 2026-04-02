import { ITcpRawLog } from "electron/main/models/TcpRawLogBus";
import { useEffect, useRef, useState } from "react";

interface TcpLogEntry {
  timestamp: string;
  payload: string;
}

const MAX_BYTES_PER_WINDOW = 512 * 1024; // 1 MB

function trimLogs(logs: TcpLogEntry[]): TcpLogEntry[] {
  let total = logs.reduce((sum, l) => sum + l.payload.length, 0);
  if (total <= MAX_BYTES_PER_WINDOW) return logs;

  const copy = [...logs];
  while (copy.length > 0 && total > MAX_BYTES_PER_WINDOW) {
    const removed = copy.shift();
    if (removed) total -= removed.payload.length;
  }
  return copy;
}

export const CommunicationMessageLog = () => {
  const [sendLogs, setSendLogs] = useState<TcpLogEntry[]>([]);
  const [recvLogs, setRecvLogs] = useState<TcpLogEntry[]>([]);

  const sendRef = useRef<HTMLDivElement | null>(null);
  const recvRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (_: Electron.IpcRendererEvent, msg: ITcpRawLog) => {
      const entry: TcpLogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        payload: msg.payload,
      };

      if (msg.direction === "send") {
        setSendLogs(prev => {
          const next = trimLogs([...prev, entry]);
          return next;
        });
      } else {
        setRecvLogs(prev => {
          const next = trimLogs([...prev, entry]);
          return next;
        });
      }
    };

    window.ipcRenderer.onTcpRawLog(handler);

    return () => {
      // rely on global removeAllListener in HomeEntry cleanup
    };
  }, []);

  useEffect(() => {
    if (sendRef.current) {
      sendRef.current.scrollTop = sendRef.current.scrollHeight;
    }
  }, [sendLogs]);

  useEffect(() => {
    if (recvRef.current) {
      recvRef.current.scrollTop = recvRef.current.scrollHeight;
    }
  }, [recvLogs]);

  return (
    <div className="w-full mt-4">
      <div className="flex flex-row gap-4">
        <div className="flex-1 border rounded p-2 h-64 bg-black text-green-300 text-xs overflow-y-auto" ref={sendRef}>
          <div className="font-semibold mb-1 text-white">TCP Send Log</div>
          {sendLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all">
              [{log.timestamp}] {log.payload}
            </div>
          ))}
        </div>
        <div className="flex-1 border rounded p-2 h-64 bg-black text-green-300 text-xs overflow-y-auto" ref={recvRef}>
          <div className="font-semibold mb-1 text-white">TCP Receive Log</div>
          {recvLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all">
              [{log.timestamp}] {log.payload}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
