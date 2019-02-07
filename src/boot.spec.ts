import "reflect-metadata"
import { boot } from "./boot"
import { TYPES } from "./container.types"
import { TweetProcessor } from "./stream/TweetProcessor"

describe("boot()", () => {
  it("should boot and return TweetProcessor from container", () => {
    const tweetProcessor = boot().get(TYPES.TweetProcessor)
    expect(tweetProcessor).toBeInstanceOf(TweetProcessor)
  })
})
