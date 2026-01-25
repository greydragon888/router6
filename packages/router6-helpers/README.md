# router6-helpers

[![npm version](https://badge.fury.io/js/router6-helpers.svg)](https://www.npmjs.com/package/router6-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Route segment testing utilities for Router6. Useful for navigation menus, breadcrumbs, conditional rendering, and route guards.

## Installation

```bash
npm install router6-helpers
# or
pnpm add router6-helpers
# or
yarn add router6-helpers
# or
bun add router6-helpers
```

## Quick Start

```typescript
import {
  startsWithSegment,
  endsWithSegment,
  includesSegment,
  areRoutesRelated,
} from "router6-helpers";

startsWithSegment("users.profile.edit", "users");     // true
endsWithSegment("users.profile.edit", "edit");        // true
includesSegment("users.profile.edit", "profile");     // true
areRoutesRelated("users", "users.profile");           // true
```

---

## API

### `startsWithSegment(route: State | string, segment?: string | null): boolean | ((segment: string) => boolean)`

Tests if route name starts with segment.\
`route: State | string` — route state object or route name string\
`segment?: string | null` — segment to test (optional for curried form)\
Returns: `boolean` (true if starts with segment, false if segment is null/empty) or `(segment: string) => boolean` (tester function if segment omitted)\
[Wiki](https://github.com/greydragon888/router6/wiki/startsWithSegment)

```typescript
// Direct usage
startsWithSegment("users.list", "users");           // true
startsWithSegment("users.profile", "users.profile"); // true (multi-segment)

// With State object
startsWithSegment({ name: "users.list", params: {}, path: "/" }, "users"); // true

// Curried form
const tester = startsWithSegment("users.profile.edit");
tester("users");  // true
tester("admin");  // false
```

### `endsWithSegment(route: State | string, segment?: string | null): boolean | ((segment: string) => boolean)`

Tests if route name ends with segment.\
`route: State | string` — route state object or route name string\
`segment?: string | null` — segment to test (optional for curried form)\
Returns: `boolean` (true if ends with segment, false if segment is null/empty) or `(segment: string) => boolean` (tester function if segment omitted)\
[Wiki](https://github.com/greydragon888/router6/wiki/endsWithSegment)

```typescript
endsWithSegment("users.profile.edit", "edit");  // true
endsWithSegment("a.b.c.d", "c.d");               // true (multi-segment)

// Curried form
const tester = endsWithSegment("users.list");
tester("list");  // true
```

### `includesSegment(route: State | string, segment?: string | null): boolean | ((segment: string) => boolean)`

Tests if route name includes segment anywhere.\
`route: State | string` — route state object or route name string\
`segment?: string | null` — segment to test (optional for curried form)\
Returns: `boolean` (true if includes segment, false if segment is null/empty) or `(segment: string) => boolean` (tester function if segment omitted)\
[Wiki](https://github.com/greydragon888/router6/wiki/includesSegment)

```typescript
includesSegment("admin.users.profile", "users");    // true
includesSegment("a.b.c.d", "b.c");                   // true (contiguous)
includesSegment("a.b.c.d", "a.c");                   // false (not contiguous)

// Curried form
const tester = includesSegment("admin.users.profile");
tester("users");     // true
tester("settings");  // false
```

### `areRoutesRelated(route1: string, route2: string): boolean`

Tests if routes are in same hierarchy (parent-child, child-parent, or same).\
`route1: string` — first route name\
`route2: string` — second route name\
Returns: `boolean` — true if routes are related (same, parent-child, or child-parent)\
[Wiki](https://github.com/greydragon888/router6/wiki/areRoutesRelated)

```typescript
// Parent-child relationship
areRoutesRelated("users", "users.list");       // true
areRoutesRelated("users", "users.profile.edit"); // true

// Child-parent relationship
areRoutesRelated("users.list", "users");       // true
areRoutesRelated("users.profile.edit", "users"); // true

// Same route
areRoutesRelated("users", "users");            // true

// Siblings (not related)
areRoutesRelated("users.list", "users.view");  // false

// Different branches (not related)
areRoutesRelated("users", "admin");            // false
```

---

## Usage Examples

### Navigation Menu

```tsx
function NavigationMenu({ currentRoute }) {
  const items = [
    { name: "Dashboard", route: "dashboard" },
    { name: "Users", route: "users" },
  ];

  return (
    <nav>
      {items.map((item) => (
        <MenuItem
          key={item.route}
          active={startsWithSegment(currentRoute, item.route)}
        >
          {item.name}
        </MenuItem>
      ))}
    </nav>
  );
}
```

### Route Guard

```typescript
const adminGuard = (router) => (toState, fromState, done) => {
  if (startsWithSegment(toState, "admin") && !isAdmin()) {
    done({ redirect: { name: "unauthorized" } });
  } else {
    done();
  }
};

router.useMiddleware(adminGuard);
```

### Conditional Rendering

```tsx
function Layout({ route, children }) {
  return (
    <div>
      {startsWithSegment(route, "admin") && <AdminSidebar />}
      {endsWithSegment(route, "edit") && <EditToolbar />}
      <main>{children}</main>
    </div>
  );
}
```

---

## Validation

Segments are validated for security:

- **Allowed:** `a-z`, `A-Z`, `0-9`, `.`, `-`, `_`
- **Max length:** 10,000 characters
- **Empty/null:** Returns `false`
- **Invalid chars:** Throws `TypeError`

```typescript
startsWithSegment("route", "valid-segment_v2");  // OK
startsWithSegment("route", "invalid!char");       // Throws TypeError
startsWithSegment("route", "");                   // false
```

See [Wiki](https://github.com/greydragon888/router6/wiki/router6-helpers#validation) for details.

---

## Migration from router5-helpers

```diff
- import { startsWithSegment, redirect } from 'router5-helpers';
+ import { startsWithSegment } from 'router6-helpers';

// Segment testing — unchanged
startsWithSegment(route, 'admin');

// redirect removed — use guards:
- router.canActivate('old', () => redirect('new'));
+ router.canActivate('old', (to, from, done) => {
+   done({ redirect: { name: 'new' } });
+ });
```

**New:** `areRoutesRelated()` for hierarchy checks.

---

## Documentation

Full documentation on [Wiki](https://github.com/greydragon888/router6/wiki):

- [startsWithSegment](https://github.com/greydragon888/router6/wiki/startsWithSegment)
- [endsWithSegment](https://github.com/greydragon888/router6/wiki/endsWithSegment)
- [includesSegment](https://github.com/greydragon888/router6/wiki/includesSegment)
- [areRoutesRelated](https://github.com/greydragon888/router6/wiki/areRoutesRelated)

---

## Related Packages

- [router6](https://www.npmjs.com/package/router6) — Core router
- [router6-react](https://www.npmjs.com/package/router6-react) — React integration

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
