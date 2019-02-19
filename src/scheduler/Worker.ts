import { injectable, inject } from "inversify"
import { TYPES } from "../container.types"
import { Scheduler, Task } from "./Scheduler"
import {
  HOUR,
  MINUTE,
  TWEET_LIMIT,
  TWITTER_TIMEFRAME,
} from "../config/constants"
import { AppState } from "../AppState"
import { TwitterActions } from "../actions/TwitterActions"

@injectable()
export class Worker {
  constructor(
    @inject(TYPES.Scheduler) private scheduler: Scheduler,
    @inject(TYPES.AppState) private appState: AppState,
    @inject(TYPES.TwitterActions) private twitterActions: TwitterActions,
  ) {}
  start() {
    this.scheduler.scheduleInterval(this.tweetFromQueue(), 14 * MINUTE)
    this.scheduler.scheduleInterval(
      this.decreaseTweetCount(),
      (TWITTER_TIMEFRAME / TWEET_LIMIT) * MINUTE,
    )
    this.scheduler.scheduleInterval(this.cutTweets(), 0.5 * HOUR)
    this.scheduler.scheduleInterval(this.unfollowRandom(), 48 * MINUTE)
    this.scheduler.scheduleInterval(
      this.getFriendsWhoDontFollowYouBack(),
      30 * MINUTE,
    )
  }

  private cutTweets(): Task {
    const TWEET_HISTORY_LIMIT = 500
    const TRIM_HISTORY_SIZE = 100

    return {
      name: "trimTweetHistory",
      action: () => {
        if (this.appState.tweetHistory.length >= TWEET_HISTORY_LIMIT) {
          this.appState.trimHistory(TRIM_HISTORY_SIZE)
        }
      },
    }
  }

  private unfollowRandom(): Task {
    return { name: "unfollowRandom", action: () => {} }
  }

  private getFriendsWhoDontFollowYouBack() {
    return { name: "getFriendsWhoDontFollowBack", action: () => {} }
  }

  private decreaseTweetCount() {
    return {
      name: "decreaseTweetCount",
      action: () => {
        this.appState.tweetCount--
      },
    }
  }

  private tweetFromQueue() {
    return {
      name: "tweetFromQueue",
      action: () => {
        if (this.appState.tweetCount <= TWEET_LIMIT) {
          const tweet = this.appState.dequeueTweet()
          if (tweet) this.twitterActions.doRetweet(tweet)
        }
      },
    }
  }
}
