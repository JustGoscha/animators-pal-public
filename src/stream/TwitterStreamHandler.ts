import Twit = require("twit")
import { inject, injectable } from "inversify"
import { TYPES } from "../container.types"
import { searchqueries } from "../config/searchqueries"
import { ILogger } from "../Logger"
@injectable()
export class TwitterStreamHandler {
  constructor(
    @inject(TYPES.Logger)
    private logger: ILogger,
    @inject(TYPES.twit)
    private twit: Twit,
  ) {}
  private reconnects = 0
  subscribeToStream(
    config: Twit.Params,
    statusHandler: (tweet: Twit.Twitter.Status) => any,
  ) {
    const stream = this.twit.stream("statuses/filter", {
      track: config.track,
      follow: searchqueries.follow,
    })
    stream.on("disconnect", disconnectMessage => {
      this.logger.info("- - - Disconnect - - - ")
      this.logger.info(disconnectMessage)
    })
    stream.on("error", error => {
      this.logger.error(error)
      this.logger.info("! ! ! ERROR ! ! !")
      process.exit(1)
    })
    stream.on("warning", warningMessage => {
      this.logger.warn("- - - Warning - - - ")
      this.logger.info(warningMessage)
    })
    stream.on("limit", LIMITMessage => {
      this.logger.info("- - - Limit - - - ")
      this.logger.info(LIMITMessage)
    })
    stream.on("reconnect", () => {
      this.logger.info(`- - - Reconnect [${this.reconnects++}] - - - `)
    })
    stream.on("connect", () => {
      if (this.reconnects == 0) {
        this.logger.info("- - - Connect - - - ")
        stream.on("tweet", statusHandler)
      }
    })
    stream.on("connected", function() {})
  }
}
