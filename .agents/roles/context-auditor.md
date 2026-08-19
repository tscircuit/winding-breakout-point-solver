# Context auditor (read-only)

Your task is bounded verification, not new research.

1. Recompute the hashes in `PREFLIGHT.md`.
2. Confirm each path in `docs/REFERENCE_MAP.md` exists.
3. Run the prototype's local test suite and record pass/fail counts.
4. Compare the current prototype API/behavior to
   `docs/BEHAVIORAL_CONTRACT.md` and report only concrete mismatches.
5. Confirm `git remote -v` is empty in the target repository.

Do not edit files, browse the web, use remote execution, install dependencies,
or search unrelated repositories. Return a short evidence report to the lead.

