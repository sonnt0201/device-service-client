
import colors from 'colors';
import path from 'path';
import { IMainLogger } from './IMainLog';

// Enable colors globally
colors.enable();

/**
 * [No-dependencies]
 * 
 * Utils log for main process (class version)
 */
export class MainLogger implements IMainLogger {
  private serviceName;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }


  private getCallerFile(): string {
    const originalPrepareStackTrace = Error.prepareStackTrace;

    try {
      Error.prepareStackTrace = (_, stack) => stack;
      const err = new Error();
      const stack = err.stack as unknown as NodeJS.CallSite[];
      const caller = stack[2];
      const filename = caller.getFileName();
      return filename ? path.basename(filename) : 'unknown';
    } catch {
      return 'unknown';
    } finally {
      Error.prepareStackTrace = originalPrepareStackTrace;
    }
  }

  private timestamp(): string {
    return new Date().toLocaleString();
  }

  public log(msg: string, content?: any) {
    const file = this.getCallerFile();
    console.log(`\n[${this.timestamp()}]`.blue, this.serviceName.blue.bold, file.bold, msg);
    if (content) console.log(content);
  }

  public error(msg: string, content?: any) {
    const file = this.getCallerFile();
    console.log(`\n[${this.timestamp()}]`.blue, this.serviceName.blue.bold, file.bold, msg.red);
    if (content) console.log(content);
  }

  public success(msg: string, content?: any) {
    const file = this.getCallerFile();
    console.log(`\n[${this.timestamp()}]`.blue, this.serviceName.blue.bold, file.bold, msg.green);
    if (content) console.log(content);
  }

   public warn(msg: string, content?: any) {
    const file = this.getCallerFile();
    console.log(`\n[${this.timestamp()}]`.blue, this.serviceName.blue.bold, file.bold, msg.yellow);
    if (content) console.log(content);
  }
}


