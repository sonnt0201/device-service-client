
export interface IMainLogger {
  log(msg: string, content?: any): void;
  error(msg: string, content?: any): void;
  success(msg: string, content?: any): void;
  warn(msg: string, content?: any):void;
}