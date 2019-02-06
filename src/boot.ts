import "reflect-metadata"
import { Container } from "inversify"
import { Logger, ILogger } from "./Logger"
import { TYPES } from "./container.types"
import { IScheduler, Scheduler } from "./Scheduler"
import twit = require("twit")
import { credentials } from "./config/credentials"

// prettier-ignore
export function boot(): Container {
  const container = new Container()
  container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope()
  container.bind<IScheduler>(TYPES.Scheduler).to(Scheduler).inSingletonScope()
  container.bind<twit>(TYPES.twit).toDynamicValue(() => {
    return new twit(credentials)
  })
  
  const logger = container.get<ILogger>(TYPES.Logger)
  logger.info("Container booted!")
  return container
}
