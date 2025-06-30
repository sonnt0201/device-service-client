import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { Observable } from "../base/Observable";

import { Socket, createServer, Server } from "net"


/**
 * [Signleton Design Pattern]
 */
export class RealtimeScreenDSListener extends Observable<IRealtimeScreenDSClientMessage> {

    private static _instance: RealtimeScreenDSListener;

    private _startListening: boolean = false

    private _tcpSocketServer: Server | undefined;

  // Track connected clients
    private _clients: Set<Socket> = new Set();
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

                    const decoded = this._decodeRealtimeMessage(chunk);

                    if (!decoded) {
                        this._logger.error("Failed to decode message:", chunk);
                        super.notify({
                            event: "screen-error",
                            meta: chunk
                        });
                    } else {
                        super.notify({
                            event: "screen",
                            screen: decoded
                        });
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
    private _decodeRealtimeMessage(jsonstr: string): IRealtimeScreen | undefined {

        let jsonObj: {

            "device_id": string,      // required, unique. ID của thiết bị. Ex: 001AC27B0048
            "timestamp": number,        // required. Ex: 1725980612000
            "screen": Array<string>      // required. Ex: ["100.0", "5.0", "20.0"]
        };


        try {
            const originJson = JSON.parse(jsonstr);
            jsonObj = originJson["content"];
            //  console.log("jsonObj", jsonObj);

        } catch (e) {
            console.log((e as Error).message);
            return undefined;
        }

        if (!jsonObj.device_id || !jsonObj.screen || !jsonObj.timestamp) {
            this._logger.error("Leak of field(s) when decode json");

            return undefined;
        }

        if (jsonObj.screen.length != 3) {
            this._logger.error("wrong screen field format");
            return undefined
        }
        // console.log("jsonObj", jsonObj);
        // everythings quite ok
        const ret: IRealtimeScreen = {
            deviceId: String(jsonObj["device_id"]),
            timestamp: jsonObj["timestamp"],
            screen: jsonObj["screen"].map((e: string) => String(e))
        }

        return ret





    };

    get startListening(): boolean {
        return this._startListening;
    }

}