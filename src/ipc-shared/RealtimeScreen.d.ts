
interface IRealtimeScreen {
    deviceId: string,
    timestamp: number,
    screen: string[],
}

interface IRealtimeKeyboardScreen {
    deviceId: string,
    timestamp: number,
    keyboard_screen: string,
}