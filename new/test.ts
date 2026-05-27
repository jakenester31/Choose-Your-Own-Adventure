class Test {
  next(a: Record<string, string>): void
  next(b: string, value: string): void

  next(
    a: Record<string, string> | string,
    b?: string
  ) {
    // if (typeof a === "string") {
    //   console.log("pair", a, b)
    // } else {
    //   console.log("record", a)
    // }
  }
}