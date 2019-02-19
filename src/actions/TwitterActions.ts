import Twit = require("twit")
import { inject, injectable } from "inversify"
import { TYPES } from "../container.types"
import { ILogger } from "../Logger"
import { AppState } from "../AppState"
import { randomTimeBetween } from "../util/randomTimeBetween"
import { TWEET_LIMIT } from "../config/constants"
import { screen_name } from "../config/credentials"
import * as _ from "lodash"

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
   * Gets followers that don't follow you back.
   */
  async getUnrequitedFollowers(): Promise<string[]> {
    const [friends, followers] = await Promise.all([
      this.getFriends(),
      this.getFollowers(),
    ])

    const friendsNotFollowingMe = friends.filter(
      friend => !followers.includes(friend),
    )

    return friendsNotFollowingMe
  }

  private getFriends(): Promise<string[]> {
    return new Promise((resolve, _reject) => {
      this.twit.get(
        "friends/ids",
        { screen_name: screen_name, stringify_ids: true, count: 5000 },
        (err, data: any) => {
          let friends: string[] = []
          if (data && !err) {
            friends = data.ids
          } else {
            this.logger.error("ERROR: some error happened")
          }
          resolve(friends)
        },
      )
    })
  }

  private getFollowers(): Promise<string[]> {
    return new Promise((resolve, _reject) => {
      this.twit.get(
        "followers/ids",
        {
          screen_name: screen_name,
          stringify_ids: true,
          count: 5000,
        },
        (err, data: any) => {
          let followers: string[] = []
          if (!err && data) {
            followers = data.ids
          }
          resolve(followers)
        },
      )
    })
  }

  /**
   * Retweet the message
   */
  doRetweet(tweet: Twit.Twitter.Status) {
    if (this.appState.tweetCount < TWEET_LIMIT) {
      const randomTime = randomTimeBetween(0, 120)
      this.logger.info(
        " - - - RETWEET IT - - - in " + Math.floor(randomTime) / 1000 + "sec",
      )
      setTimeout(() => {
        this.retweet(tweet)
      }, randomTime)

      if (tweet.entities.media && tweet.entities.media.length > 0) {
        this.logger.info("-> has media, but not link!")
      }

      this.appState.pushHistory(tweet)
      this.logger.info(
        "tweeted: " +
          this.appState.tweetHistory.length +
          " counter: " +
          this.appState.tweetCount,
      )
    } else {
      this.logger.info(
        "<-- Pushed on QUEUE: " + this.appState.tweetQueue.length,
      )
      this.appState.pushQueue(tweet)
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
    this.appState.tweetCount++
    this.twit.post("statuses/retweet/:id", { id: tweet.id_str }, err => {
      if (err) {
        this.logger.info("- - - retweet ERROR: " + err)
      }
    })
  }
}
