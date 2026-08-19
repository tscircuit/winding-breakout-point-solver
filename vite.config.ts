import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      examples: path.resolve(import.meta.dirname, "examples"),
      lib: path.resolve(import.meta.dirname, "lib"),
      tests: path.resolve(import.meta.dirname, "tests"),
    },
  },
})
