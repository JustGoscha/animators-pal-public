import Twit = require("twit")

import { inject, injectable } from "inversify"
import { TYPES } from "../container.types"
import { searchqueries } from "../config/searchqueries"
import { ILogger } from "../Logger"
import { ITweetChecker } from "./TweetChecker"
import { TwitterActions } from "./TwitterActions"

export interface ITweetProcessor {
  startProcessingStream(): any
  processTweet(tweet: Twit.Twitter.Status): any
}

@injectable()
export class TwitterStreamHandler {
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.twit) private twit: Twit,
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

@injectable()
export class TweetProcessor implements ITweetProcessor {
  // prettier-ignore
  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    @inject(TYPES.TwitterStreamHandler) private twitterStreamHandler: TwitterStreamHandler,
    @inject(TYPES.TweetChecker) private tweetChecker: ITweetChecker,
    @inject(TYPES.TwitterActions) private twitterActions: TwitterActions,
  ) {
    this.processTweet = this.processTweet.bind(this)
  }

  startProcessingStream() {
    this.twitterStreamHandler.subscribeToStream(
      { track: searchqueries.track },
      this.processTweet,
    )
  }

  processTweet(tweet: Twit.Twitter.Status) {
    this.logger.info("from: " + tweet.user.name + " tweet_id:" + tweet.id_str)
    this.logger.info(tweet.text)

    if (this.tweetChecker.shouldRetweet(tweet)) {
      this.twitterActions.doRetweet(tweet)
      this.twitterActions.followTweeter(tweet)
    }
  }
}

export function randomTimeBetween(fromSeconds: number, toSeconds: number) {
  if (toSeconds < fromSeconds) {
    return 0
  }
  var from = fromSeconds * 1000
  var to = toSeconds * 1000 - from
  return from + Math.random() * to
}
