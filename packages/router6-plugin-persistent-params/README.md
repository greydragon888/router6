# router6-plugin-persistent-params

[![npm version](https://badge.fury.io/js/router6-plugin-persistent-params.svg)](https://www.npmjs.com/package/router6-plugin-persistent-params)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Automatically persists query parameters across all navigation transitions.

## Problem & Solution

```typescript
// Without plugin:
router.navigate("products", { lang: "en", theme: "dark" });
router.navigate("cart");
// URL: /cart  ← lang and theme are lost

// With plugin:
router.usePlugin(persistentParamsPlugin(["lang", "theme"]));
router.navigate("products", { lang: "en", theme: "dark" });
router.navigate("cart");
// URL: /cart?lang=en&theme=dark  ← automatically preserved
```

## Installation

```bash
npm install router6-plugin-persistent-params
# or
pnpm add router6-plugin-persistent-params
# or
yarn add router6-plugin-persistent-params
# or
bun add router6-plugin-persistent-params
```

## Quick Start

```typescript
import { createRouter } from "router6";
import { persistentParamsPlugin } from "router6-plugin-persistent-params";

const router = createRouter(routes);

// Option 1: Parameter names (values set on first use)
router.usePlugin(persistentParamsPlugin(["lang", "theme"]));

// Option 2: With default values
router.usePlugin(
  persistentParamsPlugin({
    lang: "en",
    theme: "light",
  }),
);

router.start();
```

---

## Configuration

| Config Type                 | Description                                 | Example             |
| --------------------------- | ------------------------------------------- | ------------------- |
| `string[]`                  | Parameter names, initial values `undefined` | `["lang", "theme"]` |
| `Record<string, primitive>` | Parameter names with defaults               | `{ lang: "en" }`    |

**Allowed value types:** `string`, `number`, `boolean`, `undefined` (to remove)

See [Wiki](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#configuration-options) for details.

---

## Behavior

### Persistence

```typescript
router.navigate("page1", { lang: "en" }); // Saved: lang=en
router.navigate("page2"); // URL: /page2?lang=en
```

### Update

```typescript
router.navigate("page", { lang: "fr" }); // Updates saved value
```

### Remove

```typescript
router.navigate("page", { lang: undefined }); // Removes from persistent params
```

### Priority

Explicit values override saved ones:

```typescript
// Saved: lang=en
router.navigate("page", { lang: "de" }); // URL: /page?lang=de
```

See [Wiki](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#behavior) for edge cases and guarantees.

---

## Usage Examples

### Multilingual App

```typescript
router.usePlugin(persistentParamsPlugin({ lang: "en" }));

router.navigate("settings", { lang: "fr" });
router.navigate("products"); // ?lang=fr
router.navigate("cart"); // ?lang=fr
```

### UTM Tracking

```typescript
router.usePlugin(
  persistentParamsPlugin(["utm_source", "utm_medium", "utm_campaign"]),
);

// User arrives: /?utm_source=google&utm_medium=cpc
router.navigate("products"); // UTM params preserved
router.navigate("checkout"); // UTM params preserved
```

---

## Lifecycle

```typescript
const unsubscribe = router.usePlugin(persistentParamsPlugin(["mode"]));

// Later: restore original router behavior
unsubscribe();
```

**Note:** Double initialization throws an error. Call `unsubscribe()` first.

---

## Documentation

Full documentation on [Wiki](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin):

- [Configuration Options](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#configuration-options)
- [Lifecycle Hooks](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#lifecycle-hooks)
- [Behavior & Edge Cases](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#behavior)
- [Migration from router5](https://github.com/greydragon888/router6/wiki/persistentParamsPlugin#migration-from-router5)

---

## Related Packages

- [router6](https://www.npmjs.com/package/router6) — Core router
- [router6-plugin-browser](https://www.npmjs.com/package/router6-plugin-browser) — Browser history

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
