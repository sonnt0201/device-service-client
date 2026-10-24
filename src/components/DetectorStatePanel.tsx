import { Chip, Stack, Typography } from "@mui/material";
import { IReportDetectorStateMsg } from "@/ipc-shared/IReportDetectorStateMsg";

interface DetectorStatePanelProps {
  /** State mới nhất thiết bị đã chọn báo lên; undefined nếu chưa nhận được */
  state?: IReportDetectorStateMsg;
}

/**
 * Nội bộ (LogiAPI §17): state hiện tại của 3 máy phát hiện trên thiết bị bàn phím.
 * Chỉ để chẩn đoán, không phải API công khai.
 */
export const DetectorStatePanel = ({ state }: DetectorStatePanelProps) => {
  const isPreset = state?.preset_state === "PRESET";
  const isPumping = state?.pump_state === "PUMPING";
  const isSettingPrice = state?.price_state === "SET_PRICE";

  return (
    <Stack direction="row" spacing={2} alignItems="center" className="px-4 py-2 flex-wrap">
      <Typography variant="subtitle2">Máy phát hiện (nội bộ)</Typography>

      <Chip
        size="small"
        label={`Preset: ${state?.preset_state ?? "?"}${isPreset ? (state?.preset_confident ? " · Confident" : " · Not confident") : ""}`}
        color={isPreset ? "warning" : "default"}
        variant={isPreset ? "filled" : "outlined"}
      />
      <Chip
        size="small"
        label={`Log bơm: ${state?.pump_state ?? "?"}`}
        color={isPumping ? "success" : "default"}
        variant={isPumping ? "filled" : "outlined"}
      />
      <Chip
        size="small"
        label={`Cài giá: ${state?.price_state ?? "?"}`}
        color={isSettingPrice ? "info" : "default"}
        variant={isSettingPrice ? "filled" : "outlined"}
      />

      {state && (
        <Typography variant="caption" color="text.secondary">
          cập nhật {new Date(state.timestamp).toLocaleTimeString()}
        </Typography>
      )}
    </Stack>
  );
};
