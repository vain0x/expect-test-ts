import * as assert from "assert"
import { Project, SyntaxKind } from "ts-morph"

/**
 * Check if the function returns an expected value.
 *
 * If the test runs with environment variable `ACCEPT`=1,
 * the expected parameter is overwritten to the actual value.
 *
 * USAGE:
 *
 * ```ts
 * expect("hi", s => s.toUpperCase(), "HI")
 *
 * // If you have multiple cases, you want define a function.
 * const f = (s: string) => s.toUpperCase()
 * expect("", f, "")
 * expect("hi", f, "HI")
 * expect("BYE", f, "BYE")
 * ```
 */
export const expect: <T>(input: T, f: (input: T) => string, expected: string) => void =
  process.env.ACCEPT !== "1"
    ? (input, f, expected) => {
      assert.strictEqual(f(input), expected, "INFO: env ACCEPT=1 to accept the actual value")
    }
    : (input, f, expected) => {
      const actual = f(input)
      if (actual !== expected) {
        const fail = (msg: string): never => {
          throw assert.strictEqual(actual, expected, "WARN: ACCEPT=1 is specified but expect-test-ts couldn't rewrite expected value. " + msg)
        }

        // Locate the caller based on stacktrace.
        const err = {} as Record<string, unknown>
        Error.captureStackTrace(err)
        const stack = err.stack as string
        accept(actual, stack, fail)
      }
    }

const accept = (actual: string, stack: string, fail: (msg: string) => void) => {
  // Error:
  // at Object.exports.expect (/.../src/expect.ts:7:11)
  // at expectingTest (/.../src/index.ts:16:3)
  // at ...
  const lines = stack.split(/\r?\n/g)
  if (lines.length < 2) {
    console.log(stack, lines)
    throw fail("Couldn't locate the file path from stacktrace, which was too short.")
  }

  const m = lines[2].match(/\(((?:\w\:)?[-_\w \\\/\.]+\.tsx?):(\d+):(\d+)\)/)
  if (m == null || m.length < 4) {
    console.log(lines, m)
    throw fail("Couldn't locate the file path in stacktrace. File path must end with .ts or .tsx and source-map must be enabled. Make sure you wrote \"sourceMap\": true in tsconfig.json and specified -r ts-node/register to enable source-map feature (or just use ts-node).")
  }

  const filePath = m[1]
  const row = +m[2]
  // const column = +m[3]
  // console.log("found:", filepath, row, column)

  const project = new Project()
  const sourceFile = project.addSourceFileAtPath(filePath)

  // Find call node `expect(...)`
  // TODO: Use find references?
  for (const node of sourceFile.getDescendants()) {
    if (!(
      node.getKind() === SyntaxKind.Identifier
      && node.getText() === "expect"
      && node.getStartLineNumber() === row
      // TODO: column?
    )) {
      if (node.getText() === "expect") {
        console.log("skip", node.getText(), node.getStartLineNumber())
      }
      continue
    }

    const parent = node.getParent()
    if (parent?.getKind() !== SyntaxKind.CallExpression) {
      console.log("skip", parent?.getText(), "not call expression")
      continue
    }

    const args = parent.getLastChildByKind(SyntaxKind.SyntaxList)
    const last = args?.getLastChild(node => node.getKind() !== SyntaxKind.CommaToken)

    const kind = last?.getKind()
    if (last == null || !(kind === SyntaxKind.StringLiteral || kind === SyntaxKind.TemplateExpression)) {
      throw fail("The last argument of 'expect(...)' was not either a string nor template literal (``) but was " + last?.getKindName())
    }

    console.log("expect-test-ts: Accepted the expected value at", filePath, row)
    last.replaceWithText(writer => writer.quote().write(actual).quote())
  }

  // TODO: Don't save for each assertion. We should save after all tests instead.
  project.saveSync()
  console.log("expect-test-ts: Saved.")
}
