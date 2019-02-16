import Twit = require("twit")

import { inject, injectable } from "inversify"
import { TYPES } from "../container.types"
import { searchqueries } from "../config/searchqueries"
import { ILogger } from "../Logger"
import { ITweetChecker } from "./TweetChecker"
import { TwitterActions } from "../actions/TwitterActions"
import { TwitterStreamHandler } from "./TwitterStreamHandler"

export interface ITweetProcessor {
  startProcessingStream(): any
  processTweet(tweet: Twit.Twitter.Status): any
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
