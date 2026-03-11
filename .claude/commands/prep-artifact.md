---
description: Format a Claude JSX/TSX artifact file so it works in the artifact viewer
---

Prepare the artifact file(s) in `src/artifacts/` for the local viewer. The user may specify a filename or just say "all" to process every file.

**Input:** $ARGUMENTS

## Steps

1. **Find the file(s):** If the user gave a specific filename, find it in `src/artifacts/`. If they said "all" or gave no argument, scan `src/artifacts/` for any `.jsx` or `.tsx` files that may need fixing.

2. **For each file, apply these fixes:**

   a. **Rename `.jsx` → `.tsx`:** If the file ends in `.jsx`, rename it to `.tsx` using `git mv` (or `mv` if untracked). The viewer expects `.tsx`.

   b. **Add `"use client"` directive:** If the file doesn't already start with `"use client"`, add it as the very first line. Almost all Claude artifacts use React hooks or interactivity and need this.

   c. **Ensure a default export:** Check if the file has `export default`. If not:
      - If there's a named function component (e.g. `function MovingCalculator()`), add `export default` to it or add `export default MovingCalculator;` at the bottom.
      - If there's a `const App = () => ...` or similar, add `export default App;` at the bottom.

   d. **Fix common import issues:**
      - If the file imports from libraries not installed in the project (other than `react`, `next`, or built-in modules), note them and install with `npm install`.
      - If the file uses `import React from "react"` — that's fine, leave it, but it's not required.

   e. **Remove any wrapping HTML/body/head tags:** Claude artifacts sometimes include full HTML document structure. Strip that down to just the React component.

   f. **Filename convention:** Ensure the filename is kebab-case (e.g. `MovingCalculator.tsx` → `moving-calculator.tsx`). Rename if needed.

3. **Verify the file compiles:** Run `npx tsc --noEmit src/artifacts/<filename>.tsx` to check for TypeScript errors. Fix any issues found.

4. **Report** what you did: list each file processed and what changes were made.
