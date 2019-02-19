import { injectable } from "inversify"
import { Twitter } from "twit"

@injectable()
export class AppState {
  private _tweetHistory: Twitter.Status[] = []
  private _tweetCount: number = 0
  private _tweetQueue: Twitter.Status[] = []

  get tweetQueue(): ReadonlyArray<Twitter.Status> {
    return this.tweetQueue
  }

  get tweetHistory(): ReadonlyArray<Twitter.Status> {
    return this._tweetHistory
  }

  set tweetHistory(history: ReadonlyArray<Twitter.Status>) {
    this._tweetHistory = [...history]
  }

  get tweetCount(): number {
    return this._tweetCount
  }

  set tweetCount(count: number) {
    this._tweetCount = count
  }

  dequeueTweet(): Twitter.Status | undefined {
    return this._tweetQueue.shift()
  }
  pushQueue(tweet: Twitter.Status) {
    this._tweetQueue.push(tweet)
  }
  pushHistory(tweet: Twitter.Status) {
    this._tweetHistory.push(tweet)
  }
  trimHistory(amount: number): Twitter.Status[] {
    return this._tweetHistory.splice(0, amount)
  }
}
