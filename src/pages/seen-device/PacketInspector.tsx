import { useMemo } from "react";
import { Box, Chip, Divider, IconButton, Stack, Typography } from "@mui/material";
import { ISeenSimFrameLog } from "@/ipc-shared/seen-sim/SeenSimContracts";

/**
 * Side panel that dissects one selected {@link ISeenSimFrameLog}.
 *
 * A small hex viewer that keeps the 12-byte header and the payload in two
 * separate blocks, and decodes the header fields
 * (`[len H][len L][MAC5..MAC0][CMD][rsv][rsv][rsv]`).
 */

const BYTES_PER_ROW = 8;

function hexToBytes(hex: string): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < hex.length; i += 2) {
    out.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

function byte2(b: number): string {
  return b.toString(16).padStart(2, "0");
}

function printable(b: number): string {
  return b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".";
}

/** One hex-dump block: offset column, hex cells, ASCII gutter. */
function HexBlock({
  bytes,
  baseOffset,
  accent,
}: {
  bytes: number[];
  baseOffset: number;
  accent: string;
}) {
  const rows: number[][] = [];
  for (let i = 0; i < bytes.length; i += BYTES_PER_ROW) {
    rows.push(bytes.slice(i, i + BYTES_PER_ROW));
  }

  return (
    <Box
      sx={{
        fontFamily: "Consolas, monospace",
        fontSize: 12,
        lineHeight: 1.7,
        textAlign: "left",
        overflowX: "auto",
      }}
    >
      {rows.map((row, r) => {
        const rowOffset = baseOffset + r * BYTES_PER_ROW;
        return (
          <Box key={r} sx={{ display: "flex", whiteSpace: "pre" }}>
            <Box component="span" sx={{ color: "text.disabled", pr: 1.5 }}>
              {rowOffset.toString(16).padStart(4, "0")}
            </Box>
            <Box component="span" sx={{ color: accent }}>
              {Array.from({ length: BYTES_PER_ROW }, (_, c) =>
                c < row.length ? byte2(row[c]) : "  ",
              ).join(" ")}
            </Box>
            <Box component="span" sx={{ color: "text.secondary", pl: 1.5 }}>
              {row.map(printable).join("")}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1} sx={{ fontSize: 12 }}>
      <Box sx={{ width: 130, color: "text.secondary", flexShrink: 0 }}>{label}</Box>
      <Box sx={{ fontFamily: "Consolas, monospace", wordBreak: "break-all" }}>{value}</Box>
    </Stack>
  );
}

export function PacketInspector({
  frame,
  onClose,
}: {
  frame: ISeenSimFrameLog;
  onClose: () => void;
}) {
  const { header, payload, fields } = useMemo(() => {
    const bytes = hexToBytes(frame.bytesHex);
    const header = bytes.slice(0, frame.headerLen);
    const payload = bytes.slice(frame.headerLen);
    const len = ((header[0] ?? 0) << 8) | (header[1] ?? 0);
    const mac = header
      .slice(2, 8)
      .map(byte2)
      .join(":");
    const reserved = header.slice(9, 12).map(byte2).join(" ");
    return {
      header,
      payload,
      fields: [
        { label: "Độ dài payload", value: `${len} byte  (0x${byte2(header[0] ?? 0)}${byte2(header[1] ?? 0)})` },
        { label: "MAC (MSB→LSB)", value: mac || "—" },
        { label: "CMD", value: `0x${byte2(frame.cmd)}  ${frame.cmdName}` },
        { label: "Dự trữ (reserved)", value: reserved || "—" },
      ],
    };
  }, [frame]);

  return (
    <Box
      sx={{
        width: { xs: "100%", md: 400 },
        flexShrink: 0,
        borderLeft: { md: "1px solid" },
        borderColor: { md: "divider" },
        pl: { md: 2 },
        pt: { xs: 2, md: 0 },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Soi gói tin</Typography>
        <IconButton size="small" onClick={onClose} aria-label="đóng">
          ✕
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          color={frame.direction === "send" ? "info" : "success"}
          label={frame.direction === "send" ? "Gửi → DS" : "Nhận ← DS"}
        />
        <Chip size="small" variant="outlined" label={`#${frame.seq}`} />
        <Chip
          size="small"
          variant="outlined"
          label={`${frame.headerLen + frame.payloadLen} byte tổng`}
        />
        <Chip
          size="small"
          variant="outlined"
          label={new Date(frame.at).toLocaleTimeString([], { hour12: false }) +
            "." +
            String(frame.at % 1000).padStart(3, "0")}
        />
      </Stack>

      <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 700 }}>
        HEADER · 12 byte
      </Typography>
      <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1, mt: 0.5, mb: 1 }}>
        <HexBlock bytes={header} baseOffset={0} accent="warning.main" />
      </Box>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {fields.map((f) => (
          <Field key={f.label} label={f.label} value={f.value} />
        ))}
      </Stack>

      <Divider sx={{ mb: 1 }} />

      <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 700 }}>
        PAYLOAD · {payload.length} byte
      </Typography>
      <Box sx={{ bgcolor: "action.hover", borderRadius: 1, p: 1, mt: 0.5 }}>
        {payload.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic" }}>
            Không có payload
          </Typography>
        ) : (
          <HexBlock bytes={payload} baseOffset={0} accent="primary.main" />
        )}
      </Box>
      <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.5 }}>
        Offset trong bảng payload tính từ 0 (byte đầu payload = byte 12 của gói).
      </Typography>
    </Box>
  );
}
