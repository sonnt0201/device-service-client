import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ISeenSimFrameLog } from "@/ipc-shared/seen-sim/SeenSimContracts";
import { PacketInspector } from "./PacketInspector";

const MAX_ROWS = 1000;

/**
 * Log window for the simulator's link to Device Service.
 *
 * - one row per framed packet, newest at the bottom, left-aligned monospace;
 * - filter to show only chosen `CMD` types;
 * - pause / continue appending new rows (buffered while paused);
 * - click a row to open the {@link PacketInspector} side panel.
 */
export function FrameLogPanel() {
  const [rows, setRows] = useState<ISeenSimFrameLog[]>([]);
  const [paused, setPaused] = useState(false);
  const [hiddenCmds, setHiddenCmds] = useState<Set<number>>(new Set());
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  const pausedRef = useRef(paused);
  const pendingRef = useRef<ISeenSimFrameLog[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    window.ipcRenderer.onSeenSimFrame?.((_, frame) => {
      if (pausedRef.current) {
        pendingRef.current.push(frame);
        setPendingCount(pendingRef.current.length);
        return;
      }
      setRows((prev) => [...prev, frame].slice(-MAX_ROWS));
    });
    // parent (SeenDeviceEntry) owns removeAllListener() on unmount
  }, []);

  useEffect(() => {
    if (!paused && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [rows, paused]);

  const resume = () => {
    setRows((prev) => [...prev, ...pendingRef.current].slice(-MAX_ROWS));
    pendingRef.current = [];
    setPendingCount(0);
    setPaused(false);
  };

  const clear = () => {
    setRows([]);
    pendingRef.current = [];
    setPendingCount(0);
    setSelectedSeq(null);
  };

  /** Distinct { cmd, name } seen so far, for the filter menu. */
  const cmdOptions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const r of rows) if (!seen.has(r.cmd)) seen.set(r.cmd, r.cmdName);
    return [...seen.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([cmd, name]) => ({ cmd, name }));
  }, [rows]);

  const toggleCmd = (cmd: number) => {
    setHiddenCmds((prev) => {
      const next = new Set(prev);
      if (next.has(cmd)) next.delete(cmd);
      else next.add(cmd);
      return next;
    });
  };

  const visibleRows = useMemo(
    () => rows.filter((r) => !hiddenCmds.has(r.cmd)),
    [rows, hiddenCmds],
  );

  const selected = useMemo(
    () => rows.find((r) => r.seq === selectedSeq) ?? null,
    [rows, selectedSeq],
  );

  const fmtTime = (at: number) =>
    new Date(at).toLocaleTimeString([], { hour12: false }) +
    "." +
    String(at % 1000).padStart(3, "0");

  return (
    <Paper elevation={2} sx={{ mt: 3, p: 1.5 }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        sx={{ mb: 1 }}
      >
        <Typography variant="subtitle2" sx={{ mr: 1 }}>
          Khung tin TCP với Device Service
        </Typography>

        {paused ? (
          <Badge badgeContent={pendingCount} color="warning" max={999}>
            <Button size="small" variant="contained" color="warning" onClick={resume}>
              Tiếp tục
            </Button>
          </Badge>
        ) : (
          <Button size="small" variant="outlined" onClick={() => setPaused(true)}>
            Tạm dừng
          </Button>
        )}

        <Button
          size="small"
          variant="outlined"
          onClick={(e) => setFilterAnchor(e.currentTarget)}
        >
          Lọc lệnh{hiddenCmds.size > 0 ? ` (ẩn ${hiddenCmds.size})` : ""}
        </Button>
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
        >
          <MenuItem dense onClick={() => setHiddenCmds(new Set())}>
            Hiện tất cả
          </MenuItem>
          <MenuItem
            dense
            onClick={() => setHiddenCmds(new Set(cmdOptions.map((o) => o.cmd)))}
          >
            Ẩn tất cả
          </MenuItem>
          {cmdOptions.length === 0 && (
            <MenuItem dense disabled>
              (chưa có gói tin)
            </MenuItem>
          )}
          {cmdOptions.map((o) => (
            <MenuItem key={o.cmd} dense onClick={() => toggleCmd(o.cmd)}>
              <Checkbox size="small" edge="start" checked={!hiddenCmds.has(o.cmd)} />
              <ListItemText
                primaryTypographyProps={{ fontFamily: "Consolas, monospace", fontSize: 12 }}
                primary={`0x${o.cmd.toString(16).padStart(2, "0")}  ${o.name}`}
              />
            </MenuItem>
          ))}
        </Menu>

        <Button size="small" variant="text" color="inherit" onClick={clear}>
          Xoá
        </Button>

        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="caption" color="text.secondary">
          {visibleRows.length}/{rows.length} khung
        </Typography>
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
        <Box
          ref={listRef}
          sx={{
            flex: 1,
            minWidth: 0,
            height: 300,
            overflowY: "auto",
            bgcolor: "#0b0b0b",
            borderRadius: 1,
            p: 1,
            fontFamily: "Consolas, monospace",
            fontSize: 12,
            textAlign: "left",
          }}
        >
          {visibleRows.length === 0 && (
            <Box sx={{ color: "#666" }}>—</Box>
          )}
          {visibleRows.map((r) => {
            const isSel = r.seq === selectedSeq;
            const preview =
              r.bytesHex.slice(0, 48) + (r.bytesHex.length > 48 ? "…" : "");
            return (
              <Box
                key={r.seq}
                onClick={() => setSelectedSeq(isSel ? null : r.seq)}
                sx={{
                  cursor: "pointer",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  px: 0.5,
                  borderRadius: 0.5,
                  bgcolor: isSel ? "rgba(120,170,255,0.22)" : "transparent",
                  "&:hover": { bgcolor: isSel ? "rgba(120,170,255,0.22)" : "rgba(255,255,255,0.06)" },
                  color: r.direction === "send" ? "#8cf" : "#8f8",
                }}
              >
                [{fmtTime(r.at)}] {r.direction === "send" ? "TX" : "RX"}{" "}
                <Box component="span" sx={{ color: "#ddd" }}>
                  0x{r.cmd.toString(16).padStart(2, "0")} {r.cmdName}
                </Box>{" "}
                <Box component="span" sx={{ color: "#888" }}>
                  ({r.payloadLen}B) {preview}
                </Box>
              </Box>
            );
          })}
        </Box>

        {selected && (
          <PacketInspector frame={selected} onClose={() => setSelectedSeq(null)} />
        )}
      </Stack>

      {paused && (
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          sx={{ mt: 1 }}
          label={`Đang tạm dừng — ${pendingCount} khung đang chờ`}
        />
      )}
    </Paper>
  );
}
