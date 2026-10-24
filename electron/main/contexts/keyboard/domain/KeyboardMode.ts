import { KeyboardMode } from "@/ipc-shared/MessageType";

/**
 * Chế độ bàn phím — `manu` (Thủ công) | `auto` (Tự động), theo LogiAPI 21-07-2026 (D3).
 * Kiểu gốc sống ở shared contracts; context bàn phím thêm guard để chặn giá trị lạ sớm.
 */
export type { KeyboardMode };

export function isKeyboardMode(value: unknown): value is KeyboardMode {
  return value === "manu" || value === "auto";
}
