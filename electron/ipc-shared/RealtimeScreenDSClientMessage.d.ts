

/**
 * Message type for Realtime screen. Also notify state of connection with Device Service.
 * 
 */
interface IRealtimeScreenDSClientMessage {
    event: "screen" | "screen-error" | "connection-closed" | "connection-error" | "connection-established",
    screen?: IRealtimeScreen,
    meta?: string; ///< Additional info if exception happened 
}