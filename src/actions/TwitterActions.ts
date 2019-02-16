import Twit = require("twit")
import { inject, injectable } from "inversify"
import { TYPES } from "../container.types"
import { ILogger } from "../Logger"
import { AppState } from "../AppState"
import { randomTimeBetween } from "../util/randomTimeBetween"

@injectable()
export class TwitterActions {
  constructor(
    @inject(TYPES.twit)
    private twit: Twit,
    @inject(TYPES.Logger)
    private logger: ILogger,
    @inject(TYPES.AppState)
    private appState: AppState,
  ) {}
  // TODO move to AppState
  counter = 0
  // TODO move to config
  LIMIT = 0
  queue: Twit.Twitter.Status[] = []

  /**
   * Follow the guy/gal who tweeted this
   * @param  {[type]} tweet
   * @return {[type]}
   */
  followTweeter(tweet: Twit.Twitter.Status) {
    // don't follow everybody...
    if (!tweet.user.following) {
      if (Math.random() > 0.77) {
        this.logger.info("* * * Yeahy! Follow the user! * * *")
        setTimeout(() => {
          this.follow(tweet) // follow sometime within the hour
        }, Math.random() * 1000 * 60 * 60)
      }
    } else {
      this.logger.info("-> Already following user...")
    }
  }
  /**
   * Retweet the message
   */
  doRetweet(tweet: Twit.Twitter.Status) {
    if (this.counter < this.LIMIT) {
      this.counter++
      var randomTime = randomTimeBetween(0, 120)
      this.logger.info(
        " - - - RETWEET IT - - - in " + Math.floor(randomTime) / 1000 + "sec",
      )
      setTimeout(() => {
        this.retweet(tweet)
      }, randomTime)
      if (tweet.entities.media && tweet.entities.media.length > 0) {
        this.logger.info("-> has media, but not link!")
      }
      this.appState.pushTweet(tweet)
      this.logger.info(
        "tweeted: " + this.appState.tweets.length + " counter: " + this.counter,
      )
    } else {
      this.logger.info("<-- Pushed on QUEUE: " + this.queue.length)
      this.queue.push(tweet)
    }
  }
  private follow = (tweet: Twit.Twitter.Status) => {
    this.twit.post(
      "friendships/create",
      { user_id: tweet.user.id_str },
      err => {
        if (err) {
          this.logger.info("- - - follow ERROR: " + err)
        }
      },
    )
  }
  private retweet = (tweet: Twit.Twitter.Status) => {
    this.twit.post("statuses/retweet/:id", { id: tweet.id_str }, err => {
      if (err) {
        this.logger.info("- - - retweet ERROR: " + err)
      }
    })
  }
}
