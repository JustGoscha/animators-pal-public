export function randomTimeBetween(fromSeconds: number, toSeconds: number) {
  if (toSeconds < fromSeconds) {
    return 0
  }
  var from = fromSeconds * 1000
  var to = toSeconds * 1000 - from
  return from + Math.random() * to
}
