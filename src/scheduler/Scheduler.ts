import { inject } from "inversify"
import { ILogger } from "../Logger"
import { TYPES } from "../container.types"

export type Task = {
  name: string
  action: Function
}

export interface IScheduler {
  scheduleTask(task: Task, milliseconds: number): Promise<void>
  scheduleInterval(task: Task, milliseconds: number): Promise<void>
}

export class Scheduler implements IScheduler {
  constructor(@inject(TYPES.Logger) private logger: ILogger) {}

  scheduleTask(task: Task, milliseconds: number): Promise<void> {
    this.logger.info(`Task: ${task.name} scheduled after ${milliseconds}ms!`)
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          this.logger.info(`Task: ${task.name} running...`)
          await task.action()
          this.logger.info(`Task: ${task.name} finished!`)
          resolve()
        } catch (e) {
          reject(e)
          this.logger.info(`Task: ${task.name} failed with error ${e}!`)
        }
      }, milliseconds)
    })
  }

  scheduleInterval(task: Task, milliseconds: number): Promise<void> {
    this.logger.info(`Task: ${task.name} scheduled every ${milliseconds}ms!`)
    return new Promise((resolve, reject) => {
      setInterval(async () => {
        try {
          this.logger.info(`Task: ${task.name} running...`)
          await task.action()
          this.logger.info(`Task: ${task.name} finished!`)
          resolve()
        } catch (e) {
          this.logger.info(`Task: ${task.name} failed with error ${e}!`)
          reject(e)
        }
      }, milliseconds)
    })
  }
}
