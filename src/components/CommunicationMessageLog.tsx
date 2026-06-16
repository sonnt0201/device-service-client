import { Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { TcpRawLogBus } from "../../electron/main/models/TcpRawLogBus";
import { ITcpRawLog } from "../../electron/main/models/TcpRawLogBus";
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
  const [isSendRecording, setIsSendRecording] = useState<boolean>(true);
  const [isRecvRecording, setIsRecvRecording] = useState<boolean>(true);
  const [sendQuery, setSendQuery] = useState<string>("");
  const [recvQuery, setRecvQuery] = useState<string>("");
  const [recvMode, setRecvMode] = useState<"all" | "stream" | "event">("all");

  const sendRef = useRef<HTMLDivElement | null>(null);
  const recvRef = useRef<HTMLDivElement | null>(null);
  const isSendRecordingRef = useRef(isSendRecording);
  const isRecvRecordingRef = useRef(isRecvRecording);

  useEffect(() => {
    isSendRecordingRef.current = isSendRecording;
  }, [isSendRecording]);

  useEffect(() => {
    isRecvRecordingRef.current = isRecvRecording;
  }, [isRecvRecording]);

  const appendSendLog = (entry: TcpLogEntry) => {
    setSendLogs(prev => trimLogs([...prev, entry]));
  };

  const appendRecvLog = (entry: TcpLogEntry) => {
    setRecvLogs(prev => trimLogs([...prev, entry]));
  };

  const matchesQuery = (payload: string, query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return true;
    if (trimmed.startsWith("/") && trimmed.endsWith("/") && trimmed.length > 2) {
      const pattern = trimmed.slice(1, -1);
      try {
        return new RegExp(pattern).test(payload);
      } catch {
        return payload.includes(trimmed);
      }
    }
    return payload.includes(trimmed);
  };

  useEffect(() => {
    const handler = (_: Electron.IpcRendererEvent, msg: ITcpRawLog) => {
      const entry: TcpLogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        payload: msg.payload,
      };

      if (msg.direction === "send") {
        if (isSendRecordingRef.current) appendSendLog(entry);
      } else {
        if (!isRecvRecordingRef.current) return;
        const isEvent = msg.source === "event";
        const isStream = !isEvent;

        if (recvMode === "event" && !isEvent) return;
        if (recvMode === "stream" && !isStream) return;

        appendRecvLog(entry);
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
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            marginBottom={1}
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "#000",
              paddingY: 1,
            }}
          >
            <Typography variant="subtitle2" color="white">
              SENT
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search or /regex/"
                value={sendQuery}
                onChange={(e) => setSendQuery(e.target.value)}
                InputProps={{
                  style: { color: "white" },
                }}
              />
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setIsSendRecording(prev => {
                    const next = !prev;
                    appendSendLog({
                      timestamp: new Date().toLocaleTimeString(),
                      payload: next ? "[log] Recording resumed" : "[log] Recording paused",
                    });
                    return next;
                  });
                }}
              >
                {isSendRecording ? "Pause" : "Resume"}
              </Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setSendLogs([])}>
                Clear
              </Button>
            </Stack>
          </Stack>
          {sendLogs.filter(log => matchesQuery(log.payload, sendQuery)).map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all text-left" style={{ fontFamily: "Consolas, monospace" }}>
              [{log.timestamp}] {log.payload}
            </div>
          ))}
        </div>
        <div className="flex-1 border rounded p-2 h-64 bg-black text-green-300 text-xs overflow-y-auto" ref={recvRef}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            marginBottom={1}
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              backgroundColor: "#000",
              paddingY: 1,
            }}
          >
            <Typography variant="subtitle2" color="white">
              RECEIVED
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              {/* <ToggleButtonGroup
                size="small"
                exclusive
                value={recvMode}
                onChange={(_, next) => {
                  if (next) setRecvMode(next);
                }}
                sx={{
                  ".MuiToggleButton-root": {
                    color: "#fff",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                  },
                  ".MuiToggleButton-root.Mui-selected": {
                    color: "#fff",
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                  ".MuiToggleButton-root.Mui-selected:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.28)",
                  },
                }}
              >
             
                <ToggleButton value="stream" size="small">Stream</ToggleButton>
                <ToggleButton value="event" size="small">Event</ToggleButton>
              </ToggleButtonGroup> */}
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search or /regex/"
                value={recvQuery}
                onChange={(e) => setRecvQuery(e.target.value)}
                InputProps={{
                  style: { color: "white" },
                }}
              />
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => {
                  setIsRecvRecording(prev => {
                    const next = !prev;
                    appendRecvLog({
                      timestamp: new Date().toLocaleTimeString(),
                      payload: next ? "[log] Recording resumed" : "[log] Recording paused",
                    });
                    return next;
                  });
                }}
              >
                {isRecvRecording ? "Pause" : "Resume"}
              </Button>
              <Button size="small" variant="outlined" color="inherit" onClick={() => setRecvLogs([])}>
                Clear
              </Button>
            </Stack>
          </Stack>
          {recvLogs.filter(log => matchesQuery(log.payload, recvQuery)).map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-all text-left" style={{ fontFamily: "Consolas, monospace" }}>
              [{log.timestamp}] {log.payload}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
