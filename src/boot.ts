import "reflect-metadata"
import { Container } from "inversify"
import { Logger, ILogger } from "./Logger"
import { TYPES } from "./container.types"
import { IScheduler, Scheduler } from "./Scheduler"
import twit = require("twit")
import { credentials } from "./config/credentials"
import { TwitterStreamHandler, TweetProcessor } from "./stream/TweetProcessor"
import { TwitterActions } from "./stream/TwitterActions"
import { TweetChecker } from "./stream/TweetChecker"
import { AppState } from "./AppState"

// prettier-ignore
export function boot(): Container {
  const container = new Container()
  container.bind<ILogger>(TYPES.Logger).to(Logger).inSingletonScope()
  container.bind<AppState>(TYPES.AppState).to(AppState).inSingletonScope()
  container.bind<IScheduler>(TYPES.Scheduler).to(Scheduler).inSingletonScope()
  container.bind<TwitterStreamHandler>(TYPES.TwitterStreamHandler).to(TwitterStreamHandler).inSingletonScope()
  container.bind<TweetProcessor>(TYPES.TweetProcessor).to(TweetProcessor).inSingletonScope()
  container.bind<TweetChecker>(TYPES.TweetChecker).to(TweetChecker).inSingletonScope()
  container.bind<TwitterActions>(TYPES.TwitterActions).to(TwitterActions).inSingletonScope()
  container.bind<twit>(TYPES.twit).toDynamicValue(() => {
    return new twit(credentials)
  })
  
  const logger = container.get<ILogger>(TYPES.Logger)
  logger.info("Container booted!")
  return container
}
