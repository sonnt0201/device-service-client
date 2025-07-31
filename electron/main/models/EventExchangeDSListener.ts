import { Observable } from "../base/Observable";
import { IMainLogger } from "../base/IMainLog";
import { MainLogger } from "../base/MainLog";
import { createServer, Server, Socket } from "net";
import { IEventMsg } from "@/ipc-shared/IEventMsg";




/**
 * [Signleton Design Pattern]
 * 
 * Open TCP server to listen incomming events from Device Service.
 * 
 * Messages received are notified to observers via `eventMsgNotifier` using [Observable Design Pattern]
 * 
 * Message notified via `eventMsgNotifier` has `IEventMsg` type
 * 
 * If a IPCController receives a message, should subcribe and have a filter to choose what messag_type to handle.
 */
export class EventExchangeDSListener {

    /**
     * [Observable Design Pattern] Notifier for gas log events. (pump session)
     */
    public eventMsgNotifier: Observable<IEventMsg> = new Observable<IEventMsg>();


    private static _instance: EventExchangeDSListener;
    private _logger: IMainLogger = new MainLogger("EventExchangeDSClient");
    private _dsTCPEventServer: Server | undefined;


    private _startListening: boolean = false; /// define if ds listener is started or not

    // Track connected clients
    private _clients: Set<Socket> = new Set();

    private constructor() { }

    public static getInstance(): EventExchangeDSListener {
        if (!EventExchangeDSListener._instance) {
            EventExchangeDSListener._instance = new EventExchangeDSListener();
        }
        return EventExchangeDSListener._instance;
    }




    /**
     * Send string to all clients connected
     * 
     * Check if TCP Server (to listen to DS) is not null then send msg.
     * 
     * This function add \r\n as message delimiter to argument then send to all clients
     * @param msg 
     * @returns 
     */
    send(msg: string) {

        /// GUARD
        if (!this._dsTCPEventServer) {
            this._logger.error("Server has not started and msg cannot be sent.")
            return;
        }

        /// GUARD
        if (!this._clients.size) {
            this._logger.warn("No client to send message")
        }

        for (const socket of this._clients) {
            if (!socket.destroyed) {
                socket.write(msg + '\r\n\r\n'); // \r\n as message delimiter
                this._logger.log("Sent message to device:", msg);
            }
        }
    }

    listen() {
        // this._logger.log(`Trying to open connection ...`);
        if (this._startListening) {

            this._logger.warn("Already listening!")
            return;
        }

        this._startListening = true;
        /// TODO: implement auto reconnect and handle disconnections
        this._dsTCPEventServer = createServer((socket) => {
            // if (!_tcpSocketServer)  return;
            this._clients.add(socket);/// add new client socket

            socket.on('data', (data) => {

                const chunks = data.toString().split('\r\n');
                for (const chunk of chunks) {

                    if (chunk.length === 0) break; // skip empty lines


                    const decoded: IEventMsg = JSON.parse(chunk);

                    this.eventMsgNotifier.notify(decoded);

                    // this._logger.log("decoded object", chunk);

                }
            });


            socket.on('close', () => {
                this._logger.warn('Connection closed');
                this._clients.delete(socket)


            });

            socket.on('error', (err) => {
                this._logger.error('Error:', err.message);
                this._clients.delete(socket)

            });


        })

        this._dsTCPEventServer.listen(5002, () => {
            console.log(`TCP server listening on port ${5002}`);
        });
    }


    get startListening(): boolean {
        return this._startListening
    }


}