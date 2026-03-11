# Claude Artifacts Viewer

A simple local app for saving and viewing the interactive apps, tools, and visualizations that AI assistants like Claude, ChatGPT, and others generate during conversations.

You know those little apps that pop up in the chat window — calculators, charts, games, dashboards? Normally they disappear when you close the conversation. This project gives them a permanent home on your computer.

## What this looks like

- A homepage that lists every artifact you've saved
- Each artifact gets its own page you can visit anytime
- Everything runs locally on your machine — no accounts, no cloud, no subscriptions

## Getting started (no coding experience needed)

You'll need to install two things first. These are one-time steps.

### 1. Install Node.js

Node.js is what runs the app on your computer.

1. Go to [nodejs.org](https://nodejs.org)
2. Click the big green button that says **"LTS"** (the recommended version)
3. Open the downloaded file and follow the installer
4. To verify it worked, open **Terminal** (Mac) or **Command Prompt** (Windows) and type:
   ```
   node --version
   ```
   You should see a version number like `v22.x.x`

### 2. Download this project

**Option A — If you have `git` installed:**
```bash
git clone https://github.com/jacobmedure/claude-artifacts.git
cd claude-artifacts
npm install
```

**Option B — No git? No problem:**
1. Click the green **"Code"** button at the top of this page
2. Click **"Download ZIP"**
3. Unzip the folder somewhere you'll remember (like your Desktop or Documents)
4. Open Terminal, then type `cd ` (with a space after), drag the folder into the Terminal window, and press Enter
5. Type `npm install` and press Enter

### 3. Start the app

```bash
npm run dev
```

Open your browser and go to **[http://localhost:3000](http://localhost:3000)**

You should see the homepage with one example artifact. That means it's working.

## How to save an artifact from a conversation

### From Claude (claude.ai)

1. When Claude generates an interactive artifact (a React component), you'll see it in the conversation
2. Click the **"Code"** tab on the artifact to see the source code
3. Select all the code and copy it (Ctrl+C / Cmd+C)
4. Open a text editor (TextEdit on Mac, Notepad on Windows — or VS Code if you have it)
5. Paste the code and save the file to the `src/artifacts/` folder inside this project
6. Name it with dashes, ending in `.tsx` — for example: `budget-tracker.tsx`

### From ChatGPT, Gemini, or other AI tools

Same idea — if the AI generates a React component:
1. Copy the code from the conversation
2. Save it as a `.tsx` file in `src/artifacts/`

### What the file needs

Most AI-generated artifacts will work as-is, but they need these two things:

**1. `"use client"` on the very first line.** This tells the app it's interactive. If it's missing, add it:
```tsx
"use client";

// ... rest of the code
```

**2. A default export.** Look for `export default function` somewhere in the file. If you see just `function MyApp()` without `export default`, change it to `export default function MyApp()`.

### Quick example

Say Claude made you a tip calculator. You'd:
1. Copy the code
2. Save it as `src/artifacts/tip-calculator.tsx`
3. Make sure `"use client"` is on line 1
4. Go to `http://localhost:3000/a/tip-calculator`

That's it. The file is saved forever in the project, and you can view it anytime by running `npm run dev`.

## If you use Claude Code (the terminal tool)

This project includes a built-in command that automatically formats any file you drop in:

```
/prep-artifact tip-calculator.jsx
```

This will:
- Rename `.jsx` to `.tsx`
- Add `"use client"` if missing
- Fix the export if needed
- Install any missing libraries the artifact uses
- Check for errors

You can also run `/prep-artifact all` to fix every file in the artifacts folder at once.

## If something doesn't work

### "Module not found" error
The artifact uses a library that isn't installed. In Terminal, run:
```bash
npm install <library-name>
```
Replace `<library-name>` with whatever the error message says is missing (e.g., `recharts`, `framer-motion`, `lucide-react`).

### Blank page
- Check that `"use client"` is on line 1 of the file
- Check that there's an `export default` in the file
- Look at the Terminal window where `npm run dev` is running — error messages will appear there

### The app won't start
- Make sure you ran `npm install` first
- Make sure you're in the right folder (the one with `package.json` in it)
- Try closing Terminal, opening it again, navigating to the folder, and running `npm run dev` again

## Your artifacts are private

The `.gitignore` file is set up so that your personal artifacts are never uploaded if you push this project anywhere. Only the example counter is tracked in git. Your files stay on your machine.

## Contributing

Want to help make this better? See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, feature ideas, and pull requests are all welcome.

## License

MIT — do whatever you want with it. See [LICENSE](LICENSE).
