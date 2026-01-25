# router6-plugin-logger

[![npm version](https://badge.fury.io/js/router6-plugin-logger.svg)](https://www.npmjs.com/package/router6-plugin-logger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Console logging plugin for Router6. Provides transition timing, parameter diff tracking, and log grouping.

## Installation

```bash
npm install router6-plugin-logger
# or
pnpm add router6-plugin-logger
# or
yarn add router6-plugin-logger
# or
bun add router6-plugin-logger
```

## Quick Start

```typescript
import { createRouter } from "router6";
import { loggerPluginFactory } from "router6-plugin-logger";

const router = createRouter(routes);

// Use with default settings
router.usePlugin(loggerPluginFactory());

router.start();
```

**Console output:**

```
[logger-plugin] Router started
▼ Router transition
  [logger-plugin] Transition: home → users {from: {...}, to: {...}}
  [logger-plugin] Transition success (1.23ms) {to: {...}, from: {...}}
```

---

## API

### `loggerPluginFactory(options?)`

Factory for creating a plugin instance with optional configuration.

```typescript
import { loggerPluginFactory } from "router6-plugin-logger";

router.usePlugin(loggerPluginFactory());
```

### `loggerPlugin`

Ready-to-use plugin instance with default settings. Provided for backward compatibility.

```typescript
import { loggerPlugin } from "router6-plugin-logger";

router.usePlugin(loggerPlugin);
```

---

## Features

### Timing Display

```
[logger-plugin] Transition success (15ms)      // normal
[logger-plugin] Transition success (27.29μs)   // fast (<0.1ms)
```

### Parameter Diff

When navigating within the same route:

```
▼ Router transition
  [logger-plugin] Transition: users.view → users.view {from: {...}, to: {...}}
  [logger-plugin]   Changed: { id: "123" → "456" }, Added: {"sort":"name"}
  [logger-plugin] Transition success (2.15ms) {to: {...}, from: {...}}
```

---

## SSR Support

For high-precision timing in Node.js:

```typescript
import { performance } from "perf_hooks";

if (typeof globalThis.performance === "undefined") {
  globalThis.performance = performance;
}
```

---

## Documentation

Full documentation on [Wiki](https://github.com/greydragon888/router6/wiki/loggerPlugin):

- [Lifecycle Hooks](https://github.com/greydragon888/router6/wiki/loggerPlugin#lifecycle-hooks)
- [Migration from router5](https://github.com/greydragon888/router6/wiki/loggerPlugin#migration-from-router5)

---

## Related Packages

- [router6](https://www.npmjs.com/package/router6) — Core router
- [router6-plugin-browser](https://www.npmjs.com/package/router6-plugin-browser) — Browser history

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
