import { injectable } from "inversify"

export interface ILogger {
  info(msg: string): void
  debug(msg: string): void
  error(msg: string): void
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

  private transform = (message: string) => {
    let logMessage = ""

    var date = new Date()
    var date_string =
      date.getFullYear() +
      "." +
      (date.getMonth() + 1) +
      "." +
      date.getDate() +
      "-" +
      date.getHours() +
      ":" +
      date.getMinutes()
    logMessage += date_string + " | " + message + "\n"
    return logMessage
  }
}
