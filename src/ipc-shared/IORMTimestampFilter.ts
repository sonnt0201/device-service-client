
/**
 * Filter to read logs from database
 * 
 * Use as interface for param in functions to read and filter data by begin and end timestamp,
 * support limit number of rows and prior dataset to read ("newest" or "oldest")
 */
export interface IORMTimestampFilter {
    /**
     * MAC Address of hardware device
     */
    deviceID?: string

    /** Begin timestamp */
    beginTs?: number  

    /** End timestamp */
    endTs?: number 

    /** Max number of row to read */
    limit: number

    /** prior to read newest or oldest logs */
    priority: "newest" | "oldest"
}