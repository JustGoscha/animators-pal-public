import "reflect-metadata"

import { TweetChecker } from "./TweetChecker"
import { Logger } from "../Logger"
import { Twitter } from "twit"
import { AppState } from "../AppState"

describe("TweetChecker", () => {
  let tweetChecker: TweetChecker
  let appState: AppState
  beforeAll(() => {
    appState = new AppState()
    tweetChecker = new TweetChecker(new Logger(), appState)
  })

  describe("shouldRetweet()", () => {
    beforeAll(() => {
      const tweets = [
        "Checkout this great animation of @pingistan............whaaaat",
        "Whoa, that's amazibg #animation #walkcycle",
        "Hahahaha I'm such a great dude, what's wrong with the world",
      ]
      appState.tweets = tweets.map(t => ({ text: t } as Twitter.Status))
    })

    it("should correctly apply filter funnel", () => {
      const tweet = {
        text: "I'm such a great dude, what's wrong with the #world",
      } as Twitter.Status

      let willRetweet = tweetChecker.shouldRetweet(tweet, [
        ["isSimilarText", false],
      ])
      expect(willRetweet).toBe(false)
      willRetweet = tweetChecker.shouldRetweet(tweet, [["isSimilarText", true]])
      expect(willRetweet).toBe(true)

      const nonSimilarText =
        "This is a completely new tweet that's not close to any other"
      tweet.text = nonSimilarText

      willRetweet = tweetChecker.shouldRetweet(tweet, [
        ["isSimilarText", false],
      ])
      expect(willRetweet).toBe(true)
      willRetweet = tweetChecker.shouldRetweet(tweet, [["isSimilarText", true]])
      expect(willRetweet).toBe(false)
    })
  })
})
