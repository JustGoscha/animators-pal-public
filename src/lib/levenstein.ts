/*

Copyright (c) 2006. All Rights reserved.

If you use this script, please email me and let me know, thanks!

Andrew Hedges
andrew (at) hedges (dot) name

If you want to hire me to write JavaScript for you, see my resume.

http://andrew.hedges.name/resume/

*/

export const levenstein = {
  // calculate the Levenshtein distance between a and b, fob = form object, passed to the function
  difference: function(a: string, b: string) {
    let cost

    let m = a.length
    let n = b.length

    // make sure a.length >= b.length to use O(min(n,m)) space, whatever that is
    if (m < n) {
      let c = a
      a = b
      b = c
      let o = m
      m = n
      n = o
    }

    let r = new Array()
    r[0] = new Array()
    for (let c = 0; c < n + 1; c++) {
      r[0][c] = c
    }

    for (let i = 1; i < m + 1; i++) {
      r[i] = new Array()
      r[i][0] = i
      for (let j = 1; j < n + 1; j++) {
        cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1
        r[i][j] = minimator(
          r[i - 1][j] + 1,
          r[i][j - 1] + 1,
          r[i - 1][j - 1] + cost,
        )
      }
    }

    return r[m][n]
  },
}

// return the smallest of the three values passed in
function minimator(x: number, y: number, z: number) {
  if (x < y && x < z) return x
  if (y < x && y < z) return y
  return z
}
