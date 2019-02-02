import "reflect-metadata"
import { Container } from "inversify"
import { Logger, ILogger } from "./Logger"
import { TYPES } from "./container.types"
import { IScheduler, Scheduler } from "./Scheduler"

// prettier-ignore
export function boot(): Container {
  const container = new Container()
  container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope()
  container.bind<IScheduler>(TYPES.Scheduler).to(Scheduler).inSingletonScope()
  
  const logger = container.get<ILogger>(TYPES.Logger)
  logger.info("Container booted!")
  return container
}
