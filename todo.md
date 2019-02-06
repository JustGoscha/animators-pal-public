FAIL prevention:
  ☐ logs are getting to long
  ☐ logs same tweet multiple times... why?
  ☐ after a few hours without tweets... try to reconnect
  ☐ multiple connections open to twitter?...

Listen for "follow" events: 
  Retweet a random tweet with some media from the twitterer who just followed you


-------------

Make it easier to read my application
Use event system of node

- List all actions as events:
  - "eventName", "payload"
  - "retweet-command", {tweet}
  - "follow-command", {user}

- One central system where all commands are handled

- global emitter map, with typed event emitters
https://basarat.gitbooks.io/typescript/docs/tips/typed-event.html

```ts
type emitters = {
  retweet: TypedEventEmitter
  follow: TypedEventEmitter
  unfollow: TypedEventEmitter
}
```

-----
Metrics: 
Monitor likes, retweets, stats of certain kind of retweets