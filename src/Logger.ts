import { injectable } from "inversify"

export interface ILogger {
  info(msg?: string): void
  warn(msg?: string): void
  debug(msg?: string): void
  error(msg?: string): void
}

@injectable()
export class Logger implements ILogger {
  info(msg: string): void {
    console.info(this.transform(msg))
  }

  debug(msg: string): void {
    console.debug(this.transform(msg))
  }
  error(msg: string): void {
    console.error(this.transform(msg))
  }

  warn(msg: string): void {
    console.warn(this.transform(msg))
  }

  private transform = (message: string) => {
    let logMessage = ""

    var date = new Date()
    var date_string = date.toISOString()
    logMessage += date_string + " | " + message
    return logMessage
  }
}
