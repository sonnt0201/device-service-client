
export interface IORMTimestampFilter {
    beginTs?: number  
    endTs?: number 
    limit: number
    priority: "newest" | "oldest"
}