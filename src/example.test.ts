import { expect } from "./index"

// Defined by mocha.
declare const it: (title: string, body: () => void) => void

it("example", () => {
  const f = (s: string) => s.toUpperCase()  // function to be tested
  expect("first", f, "FIRST")      // OK
  expect("SECOND", f, "SECOND")    // NG
})
