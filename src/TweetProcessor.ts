import Twit = require("twit")

import { inject, injectable } from "inversify"
import { TYPES } from "./container.types"
import { searchqueries } from "./config/searchqueries"
import { ILogger } from "./Logger"

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

    let retweetIt = true
    if (
      isRetweet(tweet) ||
      checkSimilarUrls(tweet) ||
      isReplyOrMessage(tweet) ||
      wasRetweetedRecently(tweet) ||
      sameText(tweet) ||
      similarText(tweet) ||
      checkBlocklist(tweet) ||
      !mediaOrLink(tweet)
    ) {
      retweetIt = false
    }

    if (retweetIt) {
      doRetweet(tweet)
      followTweeter(tweet)
    }
  }
}

@injectable()
export class Retweeter {
  constructor(
    @inject(TYPES.twit) private twit: Twit,
    @inject(TYPES.Logger) private logger: ILogger,
  ) {}

  counter = 0
  // TODO move to config
  LIMIT = 0
  /**
   * Retweet the message
   * @param  {[type]} tweet
   * @return {[type]}
   */
  doRetweet(tweet: Twit.Twitter.Status) {
    if (this.counter < LIMIT) {
      this.counter++

      var randomTime = randomTimeBetween(0, 120)
      log(" - - - RETWEET IT - - - in " + Math.floor(randomTime) / 1000 + "sec")
      setTimeout(function() {
        retweet(tweet)
      }, randomTime)

      if (tweet.entities.media && tweet.entities.media.length > 0) {
        log("-> has media, but not link!")
      }
      tweets.push(tweet)
      log("tweeted: " + tweets.length + " counter: " + this.counter)
    } else {
      log("<-- Pushed on QUEUE: " + queue.length)
      queue.push(tweet)
    }
  }

  private retweet = (tweet: Twit.Twitter.Status) => {
    // if(credentials.production){
    // use id_str for everything because of stupid JS
    this.twit.post("statuses/retweet/:id", { id: tweet.id_str }, err => {
      if (err) {
        this.logger.info("- - - retweet ERROR: " + err)
      }
    })
  }
}
