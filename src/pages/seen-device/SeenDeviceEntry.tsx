import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Keyboard_Seen } from "@/components/ui/Keyboard_Seen";
import ScreenDisplay from "@/pages/home/ScreenDisplay";
import { ISeenSimSnapshot } from "@/ipc-shared/seen-sim/SeenSimContracts";
import { FrameLogPanel } from "./FrameLogPanel";

const DEFAULT_MAC = "0008DC780404";
const LINK_COLOR: Record<string, "default" | "warning" | "success"> = {
  idle: "default",
  connecting: "warning",
  connected: "success",
};
const STATE_LABEL: Record<string, string> = {
  IDLE: "Nghỉ",
  PRESETTING_COST: "Đặt tiền",
  PRESETTING_LIT: "Đặt lít",
  SETTING_PRICE: "Đặt giá",
  PUMPING: "Đang bơm",
  ERROR: "Lỗi",
};

/**
 * The SEEN device-simulator window. Drives `electron/main/simulators/seen-device`
 * through the `seen-device-sim` IPC channel.
 */
export const SeenDeviceEntry = () => {
  const [snapshot, setSnapshot] = useState<ISeenSimSnapshot | null>(null);
  const [mac, setMac] = useState(DEFAULT_MAC);
  const [host, setHost] = useState("localhost");
  const [port, setPort] = useState(5000);
  const [priceInput, setPriceInput] = useState("20000");
  const [flow, setFlow] = useState(0.35);
  // Device Service always runs a TLS server handshake on the device port
  // (sslcred.dll present) even with config `"tls": false`. Default on.
  const [tls, setTls] = useState(true);

  useEffect(() => {
    window.ipcRenderer.getSeenSimSnapshot?.().then(setSnapshot).catch(() => undefined);

    window.ipcRenderer.onSeenSimSnapshot?.((_, next) => {
      setSnapshot(next);
    });

    return () => {
      window.ipcRenderer.removeAllListener();
    };
  }, []);

  const connected = snapshot?.link === "connected";
  const discovering = snapshot?.discovering ?? false;
  const linkIdle = !snapshot || snapshot.link === "idle";
  const linkBusy = connected || snapshot?.link === "connecting";
  const isPhysical = snapshot?.mode === "physical";
  const keyboardMac = connected && isPhysical ? snapshot?.mac : "";

  const send = window.ipcRenderer.sendSeenSimCommand;

  const handleConnectToggle = () => {
    if (linkIdle) {
      send?.({ kind: "connect", mac: mac.trim(), host: host.trim(), port: Number(port) || 5000, tls });
    } else {
      send?.({ kind: "disconnect" });
    }
  };

  const price = useMemo(() => String(snapshot?.unitPrice ?? "-"), [snapshot?.unitPrice]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          Mô phỏng thiết bị SEEN
        </Typography>
        <Chip
          size="small"
          color={LINK_COLOR[snapshot?.link ?? "idle"]}
          label={
            snapshot?.link === "connected"
              ? "Đã kết nối Device Service"
              : snapshot?.link === "connecting"
                ? "Đang kết nối…"
                : "Chưa kết nối"
          }
        />
        {snapshot && (
          <Chip
            size="small"
            variant="outlined"
            color={snapshot.clockSynced ? "success" : "default"}
            label={snapshot.clockSynced ? "Đã đồng bộ giờ" : "Chưa đồng bộ giờ"}
          />
        )}
        {snapshot && (
          <Chip
            size="small"
            color={snapshot.mode === "physical" ? "primary" : "secondary"}
            label={`Bàn phím: ${snapshot.mode === "physical" ? "thủ công" : "tự động"}`}
          />
        )}
        <Chip size="small" variant="outlined" label={`Trạng thái: ${STATE_LABEL[snapshot?.state ?? "IDLE"]}`} />
        {snapshot && (
          <Chip
            size="small"
            variant="outlined"
            color={snapshot.tls ? "info" : "default"}
            label={snapshot.tls ? "TLS" : "TCP thô"}
          />
        )}
      </Stack>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            label="MAC thiết bị"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            disabled={linkBusy || discovering}
          />
          <TextField
            size="small"
            label="Host Device Service"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            disabled={linkBusy || discovering}
          />
          <TextField
            size="small"
            label="Cổng"
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            disabled={linkBusy || discovering}
            sx={{ width: 100 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={tls}
                onChange={(e) => setTls(e.target.checked)}
                disabled={linkBusy || discovering}
              />
            }
            label="TLS"
          />
          <Button variant="contained" onClick={handleConnectToggle} disabled={discovering}>
            {linkIdle ? "Kết nối" : "Ngắt"}
          </Button>
          {linkIdle && !discovering && (
            <Button
              variant="outlined"
              onClick={() => send?.({ kind: "discover", mac: mac.trim(), tls })}
            >
              Tự động dò (UDP)
            </Button>
          )}
          {discovering && (
            <>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                Đang nghe beacon UDP của Device Service (cổng 5001)…
              </Typography>
              <Button
                variant="text"
                color="inherit"
                onClick={() => send?.({ kind: "stop-discovery" })}
              >
                Dừng dò
              </Button>
            </>
          )}
        </Stack>
        {snapshot?.discoverySource && (
          <Typography
            variant="caption"
            color={snapshot.discoverySource.startsWith("lỗi") ? "error" : "text.secondary"}
            sx={{ mt: 1, display: "block" }}
          >
            {snapshot.discoverySource.startsWith("lỗi")
              ? snapshot.discoverySource
              : `Beacon gần nhất: ${snapshot.discoverySource}`}
          </Typography>
        )}
      </Paper>

      <Stack direction="row" spacing={3} alignItems="flex-start" flexWrap="wrap" useFlexGap>
        <Paper elevation={4} sx={{ p: 0, flex: "1 1 520px" }}>
          <Keyboard_Seen
            lcdText={snapshot?.screenText || "SEEN"}
            selectedDeviceMac={keyboardMac}
            onKeyPress={(buttonId) => send?.({ kind: "press-key", buttonId })}
          />
          {!isPhysical && connected && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 2, pb: 1, display: "block" }}>
              Bàn phím đang ở chế độ tự động — phím vật lý bị khoá, chỉ Device Service điều khiển.
            </Typography>
          )}
        </Paper>

        <Paper elevation={4} sx={{ p: 2, flex: "0 1 320px" }}>
          <Typography variant="subtitle2" gutterBottom>
            Vòi bơm &amp; cột bơm
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={snapshot?.nozzle ?? "seated"}
            onChange={(_, next) => {
              if (next) send?.({ kind: "nozzle", action: next === "lifted" ? "lift" : "seat" });
            }}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="seated">Gác vòi</ToggleButton>
            <ToggleButton value="lifted">Nhấc vòi</ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="caption" display="block" gutterBottom>
            Lưu lượng: {flow.toFixed(2)} L/s
          </Typography>
          <Slider
            size="small"
            min={0.05}
            max={2}
            step={0.05}
            value={flow}
            onChange={(_, v) => setFlow(v as number)}
            onChangeCommitted={(_, v) => send?.({ kind: "set-flow", litrePerSecond: v as number })}
            sx={{ mb: 1 }}
          />

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              size="small"
              label="Đơn giá (VND/L)"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
            />
            <Button
              variant="outlined"
              onClick={() => send?.({ kind: "set-unit-price", vnd: Number(priceInput) || 0 })}
            >
              Đặt
            </Button>
          </Stack>

          <ScreenDisplay
            totalCost={String(snapshot?.pumpedCost ?? "_")}
            fuelVolume={String(snapshot?.pumpedVolume ?? "_")}
            fuelUnitPrice={price}
          />
        </Paper>

        <Paper elevation={4} sx={{ p: 2, flex: "0 1 260px" }}>
          <Typography variant="subtitle2" gutterBottom>
            Rơ le &amp; lỗi
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            {(snapshot?.relays ?? [0, 0]).map((s, i) => (
              <Chip key={i} size="small" color={s ? "success" : "default"} label={`Rơ le ${i + 1}: ${s ? "ON" : "OFF"}`} />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" color="error" variant="outlined" onClick={() => send?.({ kind: "raise-error" })}>
              Gây lỗi E 08
            </Button>
            <Button size="small" variant="outlined" onClick={() => send?.({ kind: "clear-error" })}>
              Xoá lỗi
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Button size="small" fullWidth variant="text" onClick={() => send?.({ kind: "factory-reset" })}>
            Nhấn C (reset màn hình)
          </Button>
        </Paper>
      </Stack>

      <FrameLogPanel />
    </Box>
  );
};
