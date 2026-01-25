# router6-plugin-browser

[![npm version](https://badge.fury.io/js/router6-plugin-browser.svg)](https://www.npmjs.com/package/router6-plugin-browser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Browser History API integration for Router6. Synchronizes router state with browser URL and handles back/forward navigation.

## Installation

```bash
npm install router6-plugin-browser
# or
pnpm add router6-plugin-browser
# or
yarn add router6-plugin-browser
# or
bun add router6-plugin-browser
```

## Quick Start

```typescript
import { createRouter } from "router6";
import { browserPlugin } from "router6-plugin-browser";

const router = createRouter([
  { name: "home", path: "/" },
  { name: "products", path: "/products/:id" },
  { name: "cart", path: "/cart" },
]);

// Basic usage
router.usePlugin(browserPlugin());

// With options
router.usePlugin(
  browserPlugin({
    useHash: false,
    base: "/app",
  }),
);

router.start();
```

---

## Configuration

```typescript
router.usePlugin(
  browserPlugin({
    useHash: true, // Required for hashPrefix
    hashPrefix: "!",
  }),
);

router.navigate("products", { id: "123" });
// URL: http://example.com/#!/products/123
```

| Option            | Type      | Default | Description                                                          |
| ----------------- | --------- | ------- | -------------------------------------------------------------------- |
| `useHash`         | `boolean` | `false` | Use hash routing (`#/path`) instead of History API                   |
| `hashPrefix`      | `string`  | `""`    | Hash prefix (e.g., `"!"` → `#!/path`). Only with `useHash: true`     |
| `preserveHash`    | `boolean` | `true`  | Keep URL hash fragment during navigation. Only with `useHash: false` |
| `base`            | `string`  | `""`    | Base path for all routes (e.g., `"/app"`)                            |
| `forceDeactivate` | `boolean` | `true`  | Bypass `canDeactivate` guards on browser back/forward                |
| `mergeState`      | `boolean` | `false` | Merge with existing `history.state`                                  |

**Type Safety:** Options use discriminated union — `hashPrefix` and `preserveHash` are mutually exclusive at compile time.

See [Wiki](https://github.com/greydragon888/router6/wiki/browserPlugin#configuration-options) for detailed option descriptions and examples.

---

## Added Router Methods

The plugin extends the router with browser-specific methods:

#### `router.buildUrl(name: string, params?: Params): string`
Build full URL with base path and hash prefix.\
`name: string` — route name\
`params?: Params` — route parameters\
Returns: `string` — full URL\
[Wiki](https://github.com/greydragon888/router6/wiki/buildUrl)

```typescript
router.buildUrl("products", { id: "123" });
// Returns: "/products/123"

// With base="/app", useHash=true, hashPrefix="!"
// Returns: "/app#!/products/123"
```

#### `router.matchUrl(url: string): State | undefined`
Parse URL to router state.\
`url: string` — URL to parse\
Returns: `State | undefined`\
[Wiki](https://github.com/greydragon888/router6/wiki/matchUrl)

```typescript
const state = router.matchUrl("http://example.com/products/123");
// Returns: { name: 'products', params: { id: '123' }, ... }
```

#### `router.replaceHistoryState(name: string, params?: Params, title?: string): void`
Update browser URL without triggering navigation.\
`name: string` — route name\
`params?: Params` — route parameters\
`title?: string` — page title\
Returns: `void`\
[Wiki](https://github.com/greydragon888/router6/wiki/replaceHistoryState)

```typescript
router.replaceHistoryState("users", { id: "456" });
```

#### `router.lastKnownState: State | undefined`
Last successful navigation state (readonly).\
Returns: `State | undefined`\
[Wiki](https://github.com/greydragon888/router6/wiki/lastKnownState)

```typescript
const state = router.lastKnownState;
// Returns frozen copy of state or undefined

if (state) {
  console.log("Last route:", state.name);
  console.log("Parameters:", state.params);
}
```

---

## Usage Examples

### History Mode (default)

```typescript
router.usePlugin(
  browserPlugin({
    base: "/app",
    preserveHash: true,
  }),
);

router.navigate("users", { id: "123" });
// URL: /app/users/123
```

### Hash Mode

```typescript
router.usePlugin(
  browserPlugin({
    useHash: true,
    hashPrefix: "!",
  }),
);

router.navigate("users", { id: "123" });
// URL: #!/users/123
```

### Form Protection

```typescript
router.usePlugin(
  browserPlugin({
    forceDeactivate: false,
  }),
);

router.canDeactivate("checkout", () => (toState, fromState, done) => {
  if (hasUnsavedChanges()) {
    done({ error: new Error("Unsaved changes") });
  } else {
    done();
  }
});
```

---

## SSR Support

The plugin is SSR-safe with automatic fallback:

```typescript
// Server-side — no errors, methods return safe defaults
router.usePlugin(browserPlugin());
router.buildUrl("home"); // Works
router.matchUrl("/path"); // Returns undefined
```

---

## Documentation

Full documentation available on the [Wiki](https://github.com/greydragon888/router6/wiki/browserPlugin):

- [Configuration Options](https://github.com/greydragon888/router6/wiki/browserPlugin#configuration-options)
- [Lifecycle Hooks](https://github.com/greydragon888/router6/wiki/browserPlugin#lifecycle-hooks)
- [Router Methods](https://github.com/greydragon888/router6/wiki/browserPlugin#router-methods)
- [Behavior & Edge Cases](https://github.com/greydragon888/router6/wiki/browserPlugin#behavior)
- [Migration from router5](https://github.com/greydragon888/router6/wiki/browserPlugin#migration-from-router5)

---

## Related Packages

- [router6](https://www.npmjs.com/package/router6) — Core router
- [router6-react](https://www.npmjs.com/package/router6-react) — React integration
- [router6-plugin-logger](https://www.npmjs.com/package/router6-plugin-logger) — Debug logging

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
