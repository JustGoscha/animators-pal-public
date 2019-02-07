import { injectable } from "inversify"
import { Twitter } from "twit"

@injectable()
export class AppState {
  tweets: Twitter.Status[] = []

  pushTweet(tweet: Twitter.Status) {
    this.tweets.push(tweet)
  }
  trimTweets() {}
}
