import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { KEYBOARD_BUTTON_ID_MAP } from "@/ipc-shared/MessageType";
import { IReportKeyboardButtonsPressedMsg } from "@/ipc-shared/IReportKeyboardButtonsPressedMsg";

const MAX_BYTES_PER_WINDOW = 1024 * 1024;

type LogType = "screen" | "button";

interface LogEntry {
  timestamp: number;
  type: LogType;
  content: string;
}

function estimateEntryBytes(entry: LogEntry): number {
  return String(entry.timestamp).length + entry.type.length + entry.content.length + 2;
}

function trimEntries(entries: LogEntry[]): LogEntry[] {
  let total = entries.reduce((sum, entry) => sum + estimateEntryBytes(entry), 0);
  if (total <= MAX_BYTES_PER_WINDOW) return entries;

  const copy = [...entries];
  while (copy.length > 0 && total > MAX_BYTES_PER_WINDOW) {
    const removed = copy.shift();
    if (removed) total -= estimateEntryBytes(removed);
  }

  return copy;
}

function escapeCsv(value: string): string {
  if (value.includes("\"")) {
    value = value.replace(/\"/g, "\"\"");
  }

  if (value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `\"${value}\"`;
  }

  return value;
}

function entryToCsvRow(entry: LogEntry): string {
  return [String(entry.timestamp), entry.type, escapeCsv(entry.content)].join(",");
}

function toScreenText(msg: IRealtimeScreenDSClientMessage): string | null {
  if (msg.keyboard_screen?.keyboard_screen) {
    return msg.keyboard_screen.keyboard_screen.join('\n').trim();
  }

  if (!msg.screen) return null;
  return msg.screen.screen.filter(Boolean).join("\n").trim();
}

type ScreenButtonHistoryLogProps = {
  selectedDeviceMac?: string;
};

export const ScreenButtonHistoryLog = ({ selectedDeviceMac }: ScreenButtonHistoryLogProps) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const lastScreenByDeviceRef = useRef<Record<string, string>>({});
  const selectedDeviceRef = useRef<string | undefined>(selectedDeviceMac);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    selectedDeviceRef.current = selectedDeviceMac;
  }, [selectedDeviceMac]);

  useEffect(() => {
    const handleScreen = (_: Electron.IpcRendererEvent, msg: IRealtimeScreenDSClientMessage) => {
      const screenPayload = msg.keyboard_screen ?? msg.screen;
      if (!screenPayload) return;

      const deviceId = screenPayload.deviceId;
      const selectedDevice = selectedDeviceRef.current;
      if (selectedDevice && deviceId !== selectedDevice) return;

      const screenText = toScreenText(msg);
      if (!screenText) return;

      const lastText = lastScreenByDeviceRef.current[deviceId];
      if (lastText === screenText) return;

      lastScreenByDeviceRef.current[deviceId] = screenText;
      const entry: LogEntry = {
        timestamp: screenPayload.timestamp,
        type: "screen",
        content: screenText,
      };

      setEntries((prev) => trimEntries([...prev, entry]));
    };

    const handleButtons = (_: Electron.IpcRendererEvent, msg: IReportKeyboardButtonsPressedMsg) => {
      const selectedDevice = selectedDeviceRef.current;
      if (selectedDevice && msg.device_id !== selectedDevice) return;

      const buttonEntries: LogEntry[] = msg.button_actions
        .flatMap((action) =>
          action.button_list.map((buttonId) => ({
            timestamp: action.timestamp,
            type: "button" as const,
            content: KEYBOARD_BUTTON_ID_MAP[buttonId] ?? `#${buttonId}`,
          }))
        )
        .filter((entry) => Number.isFinite(entry.timestamp));

      if (buttonEntries.length === 0) return;

      setEntries((prev) => trimEntries([...prev, ...buttonEntries]));
    };

    window.ipcRenderer.onRealtimeScreenMsg(handleScreen);
    window.ipcRenderer.onKeyboardButtonsPressedMsg(handleButtons);

    return () => {
      // rely on global removeAllListener in HomeEntry cleanup
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => a.timestamp - b.timestamp);
  }, [entries]);

  const timestampRangeLabel = useMemo(() => {
    if (sortedEntries.length === 0) return "No timestamps";
    const first = sortedEntries[0].timestamp;
    const last = sortedEntries[sortedEntries.length - 1].timestamp;
    return `Start ${first} - End ${last}`;
  }, [sortedEntries]);

  const csvContent = useMemo(() => {
    const header = "timestamp,type,content";
    return [header, ...sortedEntries.map(entryToCsvRow)].join("\n");
  }, [sortedEntries]);

  const handleExportCsv = () => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "screen-button-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = () => {
    lastScreenByDeviceRef.current = {};
    setEntries([]);
  };

  return (
    <Paper elevation={4} sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
        <Box display="flex" alignItems="baseline" gap={1}>
          <Typography variant="subtitle1" fontWeight={700}>
            Screen & Button
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {sortedEntries.length} rows · {timestampRangeLabel}
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" onClick={handleClearAll}>
            Clear
          </Button>
          <Button size="small" variant="outlined" onClick={handleExportCsv}>
            Export
          </Button>
        </Box>
      </Box>
      <TableContainer
        component={Box}
        ref={scrollRef}

        
            sx={{
              width:"100%",
                height: 200,
                maxHeight: 300,
                overflowY: 'auto',
                overflowX: 'auto',
                //  maxHeight: 288,
                  border: "1px solid", borderColor: "divider", borderRadius: 1
            }}
        
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 160, fontWeight: 700 }}>Timestamp</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Content</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEntries.map((entry, idx) => (
              <TableRow key={`${entry.timestamp}-${entry.type}-${idx}`} hover>
                <TableCell sx={{ fontFamily: "'Courier New', monospace", fontSize: 12 }}>
                  {entry.timestamp}
                </TableCell>
                <TableCell sx={{ textTransform: "uppercase", fontSize: 11, letterSpacing: 0.4 }}>
                  {entry.type}
                </TableCell>
                <TableCell sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {entry.content}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} sx={{ py: 3, color: "text.secondary" }}>
                  No activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
