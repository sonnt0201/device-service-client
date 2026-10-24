import { IMainLogger } from "../../shared/logging/IMainLog";
import { MainLogger } from "../../shared/logging/MainLog";
import { Observable } from "../../shared/events/Observable";

import { Socket, createServer, Server } from "net"
import { TcpRawLogBus } from "../diagnostics/TcpRawLogBus";


/**
 * [Signleton Design Pattern]
 */
export class RealtimeScreenDSListener extends Observable<IRealtimeScreenDSClientMessage> {

    private static _instance: RealtimeScreenDSListener;

    private _startListening: boolean = false

    private _tcpSocketServer: Server | undefined;

  // Track connected clients
    private _clients: Set<Socket> = new Set();
        private _tcpRawLogBus: TcpRawLogBus = TcpRawLogBus.getInstance();
    private constructor() {
        super();
    }

    public static getInstance(): RealtimeScreenDSListener {
        if (!RealtimeScreenDSListener._instance) {
            RealtimeScreenDSListener._instance = new RealtimeScreenDSListener();
        }
        return RealtimeScreenDSListener._instance;
    }

    // private _tcpSocketServer: Server | undefined;

    private _logger: IMainLogger = new MainLogger("RealtimeScreenDSClient");

    /**
     * start connection with Device Service and listenning incomming raw screen data
     * 
     * @param deviceServiceHost 
     * @param deviceServiceRawPort 
     */
    listen(): void {

       // this._logger.log(`Trying to open connection ...`);
        if (this._startListening) {

            this._logger.warn("Already listening!")
            return;
        }

        this._startListening = true;


        // this._logger.log(`Trying to open connection ...`);
        this._tcpSocketServer = createServer((socket) => {
            // if (!_tcpSocketServer)  return;

            socket.on('data', (data) => {
                const chunks = data.toString().split('\r\n');

                for (const chunk of chunks) {
                    if (!chunk.trim()) continue; // skip empty lines

                    // publish raw TCP receive log
                    this._tcpRawLogBus.notify({
                        direction: "recv",
                        source: "realtime",
                        payload: chunk,
                    });

                    const decodedMessages = this._decodeRealtimeMessages(chunk);

                    if (decodedMessages.length === 0) {
                        this._logger.error("Failed to decode message:", chunk);
                        super.notify({
                            event: "screen-error",
                            meta: chunk
                        });
                    } else {
                        decodedMessages.forEach((message) => super.notify(message));
                    }
                }
            });


            socket.on('close', () => {
                super.notify({
                    event: "connection-closed"
                })

                this._clients.delete(socket)
            });

            socket.on('error', (err) => {
                this._logger.error('Error:', err.message);
                super.notify({
                    event: "connection-error",
                    meta: err.message
                })

               
                this._clients.delete(socket)
                

            });


        })

        this._tcpSocketServer.listen(5001, () => {
            console.log(`TCP server listening on port ${5001}`);
        });

    };

    /// core
    private _decodeRealtimeMessages(jsonstr: string): IRealtimeScreenDSClientMessage[] {

        let originJson: any;

        try {
            originJson = JSON.parse(jsonstr);
        } catch (e) {
            this._logger.error((e as Error).message);
            return [];
        }

        const payload = originJson?.content ?? originJson;
        const rawEntries = Array.isArray(payload)
            ? payload
            : [payload];

        const messages: IRealtimeScreenDSClientMessage[] = [];

        for (const entry of rawEntries) {
            if (!entry || !entry.device_id || !entry.timestamp) continue;

            const normalizedDeviceId = String(entry.device_id);
            const normalizedTimestamp = Number(entry.timestamp);

            //* ============ PatchPlan 26-7-21 ========
            /*
             * D1/D2: màn hình bàn phím giờ về chung trường `screen` với màn hình cột bơm.
             *
             * Vẫn đọc `keyboard_screen` như một fallback: app này dùng để test Device
             * Service, mà pha 2 (gộp stream màn hình) ship độc lập với các pha khác — nên
             * trong lúc triển khai sẽ có Device Service bản cũ lẫn bản mới. Đọc rộng,
             * ghi hẹp: chỉ sinh ra shape mới ở phía trong.
             */
            const rawLines: unknown = Array.isArray(entry.screen)
                ? entry.screen
                : entry.keyboard_screen;

            if (!Array.isArray(rawLines)) continue;

            const lines = rawLines.map((line: unknown) => String(line));

            messages.push({
                event: "screen",
                screen: {
                    deviceId: normalizedDeviceId,
                    timestamp: normalizedTimestamp,
                    screen: lines,
                    // 3 dòng = màn hình chính cột bơm; còn lại = màn hình bàn phím.
                    // Số dòng là tín hiệu DUY NHẤT còn lại để phân biệt — xem RealtimeScreen.d.ts
                    kind: lines.length === 3 ? "main" : "keyboard",
                }
            });
            // * =========== End PatchPlan 26-7-21  ========
        }

        return messages;
    };

    get startListening(): boolean {
        return this._startListening;
    }

}