import { IHasMsgType } from "./IHasMsgType";

/**
 * [Dependencies]: IHasMsgType
 * 
 * Base for every event message received from the device service.
 */
export interface IEventMsg  {
    id: string;
    content: {
        [index: string]: any;
        "message_type": number
    };
}