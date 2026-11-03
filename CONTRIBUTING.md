# Contributing

Thanks for looking. Settle is a small prototype, and a careful fix is more useful than a large rewrite.

## Setup

You need Node.js 22.

```bash
npm install && npm run dev
```

The app opens at http://localhost:8080. The September books are already in the page. They are fictional, and they stay in the browser.

## Checks

Before you open a pull request, run:

```bash
npm run lint
npm run typecheck
npm run build
```

GitHub Actions runs the same three commands.

`npm test` runs the matcher tests and the script tests. A few script tests read notes under `.grok`, which is not part of this repository, so those tests fail on a clean checkout. The matcher tests in `src/lib/settle/engine.test.ts` do not need that folder.

## Pull requests

- Keep the change small and say what a person can do now that they could not do before.
- Leave the look and the September story alone unless the issue is about that.
- Keep the prototype on the device: no account, no server upload, and no live GST portal connection.
- New matching rules belong next to the existing tests in `src/lib/settle/engine.test.ts`.

## Issues

Use a bug report, a feature request, or a question. If Discussions are turned on, a question often fits better there than in the issue list.

## Good first bugs

The review screen listens for `?`, but other screens do not. Help lists J and K, and the review screen also accepts the arrow keys. Either of those is a good place to start.
