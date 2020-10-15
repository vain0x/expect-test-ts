# expect-test-ts

Minimalistic snapshot testing for TypeScript.

## ~Install~

*Not published to NPM due to lack of some features: supporting multiline string literal, write expected value in file, etc.*

## Features

- Assert that a function returns an expected value
- Update the source code for the assertion to pass

## What?

`expect` checks if a function returns an expected string. For example, below of the two assertions, the first succeeds and the second fails.

```ts
import { expect } from "expect-test-ts"

const f = (s: string) => s.toUpperCase()  // function to be tested
expect("first", f, "FIRST")      // OK
expect("SECOND", f, "second")    // NG
```

Test runner (say, mocha) reports the error.

```sh
npx mocha src/**/*.test.ts --extension ts -r ts-node/register
```

*Possible output*:

    AssertionError [ERR_ASSERTION]
    + expected - actual

      -SECOND
      +second

You can run this test with environment variable `ACCEPT`=1, to update the source code so that these assertions pass.

```sh
ACCEPT=1 npx mocha src/**/*.test.ts --extension ts -r ts-node/register
```

*Possible output*:

    ✓ example (88ms)

    1 passing (88ms)

You sometimes want to "accept" because:

- You don't want to write the expected value by hand, and it's okay if you just look at the actual result to verify.
- The actual value slightly changed after editing, but the difference was acceptable.

## See also

Inspired with:

- [rust-analyzer/expect-test\: Minimalistic snapshot testing for Rust.](https://github.com/rust-analyzer/expect-test)

Depends on:

- [dsherret/ts-morph\: TypeScript Compiler API wrapper for static analysis and programmatic code changes.](https://github.com/dsherret/ts-morph)

## Internals: How?

- `Error.captureStackTrace` is used to determine where `expect` function is called.
- `ts-morph`, wrapper library of TypeScript compiler API, is used to locate and modify the "expected" parameter safely.
