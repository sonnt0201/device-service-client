

/**
 * Message type for Realtime screen. Also notify state of connection with Device Service.
 *
 */
interface IRealtimeScreenDSClientMessage {
    event: "screen" | "screen-error" | "connection-closed" | "connection-error" | "connection-established",
    //* ============ PatchPlan 26-7-21 ========
    /**
     * D1/D2: bỏ trường `keyboard_screen`. Màn hình bàn phím và màn hình cột bơm giờ
     * dùng chung 1 slot; phân biệt bằng {@link IRealtimeScreen.kind}.
     */
    screen?: IRealtimeScreen,
    // * =========== End PatchPlan 26-7-21  ========
    meta?: string; ///< Additional info if exception happened
}

