export class WindingBreakoutInputError extends Error {
  override readonly name = "WindingBreakoutInputError"
}

export class WindingBreakoutInfeasibleError extends Error {
  override readonly name = "WindingBreakoutInfeasibleError"
}

export class WindingBreakoutInvariantError extends Error {
  override readonly name = "WindingBreakoutInvariantError"
}

export class WindingBreakoutOutputUnavailableError extends Error {
  override readonly name = "WindingBreakoutOutputUnavailableError"
}
