import {
  WindingBreakoutSolver,
  type WindingBreakoutOutput,
  type WindingBreakoutSolverInput,
} from "../../lib"

export const cloneInput = (
  input: WindingBreakoutSolverInput,
): WindingBreakoutSolverInput => structuredClone(input)

export const solveSuccessfully = (
  input: WindingBreakoutSolverInput,
): WindingBreakoutOutput => {
  const solver = new WindingBreakoutSolver(input)
  solver.solve()
  return solver.getOutput()
}

export const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
