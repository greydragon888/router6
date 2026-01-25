# router6

[![npm version](https://badge.fury.io/js/router6.svg)](https://www.npmjs.com/package/router6)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Core router implementation for Router6.

## Installation

```bash
npm install router6
# or
pnpm add router6
# or
yarn add router6
# or
bun add router6
```

## Quick Start

```typescript
import { createRouter } from "router6";

const routes = [
  { name: "home", path: "/" },
  { name: "users", path: "/users" },
  { name: "users.profile", path: "/:id" },
];

const router = createRouter(routes);

router.start();
router.navigate("users.profile", { id: "123" });
```

---

## Essential API

### `createRouter(routes?, options?, dependencies?)`

Creates a new router instance. [Wiki](https://github.com/greydragon888/router6/wiki/createRouter)

```typescript
const router = createRouter(
  routes,       // Route[] - route definitions
  options,      // Partial<Options> - router options
  dependencies, // object - dependency injection
);
```

---

### Lifecycle

#### `router.start(startPath?, done?)`

Starts the router. [Wiki](https://github.com/greydragon888/router6/wiki/start)

```typescript
router.start();
router.start("/users/123");
router.start("/users/123", (err, state) => {
  if (err) console.error(err);
});
```

#### `router.stop()`

Stops the router. [Wiki](https://github.com/greydragon888/router6/wiki/stop)

#### `router.isStarted()`

Returns whether the router is started. [Wiki](https://github.com/greydragon888/router6/wiki/isStarted)

---

### Navigation

#### `router.navigate(name, params?, options?, done?)`

Navigates to a route by name. Returns a cancel function. [Wiki](https://github.com/greydragon888/router6/wiki/navigate)

```typescript
router.navigate("users");
router.navigate("users.profile", { id: "123" });
router.navigate("users.profile", { id: "123" }, { replace: true });

// With callback
router.navigate("users", {}, {}, (err, state) => {
  if (err) console.error(err);
});

// Cancellation
const cancel = router.navigate("users.profile", { id: "123" });
cancel(); // abort navigation
```

#### `router.getState()`

Returns the current router state. [Wiki](https://github.com/greydragon888/router6/wiki/getState)

```typescript
const state = router.getState();
// { name: "users.profile", params: { id: "123" }, path: "/users/123" }
```

#### `router.navigateToDefault(options?, done?)`

Navigates to the default route. [Wiki](https://github.com/greydragon888/router6/wiki/navigateToDefault)

---

### Guards

#### `router.canActivate(name, guardFactory)`

Registers a guard for route activation. [Wiki](https://github.com/greydragon888/router6/wiki/canActivate)

```typescript
router.canActivate("admin", () => (toState, fromState, done) => {
  if (!isAuthenticated()) {
    done({ redirect: { name: "login" } });
  } else {
    done();
  }
});
```

#### `router.canDeactivate(name, guardFactory)`

Registers a guard for route deactivation. [Wiki](https://github.com/greydragon888/router6/wiki/canDeactivate)

```typescript
router.canDeactivate("editor", () => (toState, fromState, done) => {
  if (hasUnsavedChanges()) {
    done({ error: new Error("Unsaved changes") });
  } else {
    done();
  }
});
```

---

### Events

#### `router.subscribe(listener)`

Subscribes to successful transitions. [Wiki](https://github.com/greydragon888/router6/wiki/subscribe)

```typescript
const unsubscribe = router.subscribe(({ route, previousRoute }) => {
  console.log("Navigation:", previousRoute?.name, "→", route.name);
});
```

#### `router.addEventListener(event, listener)`

Adds an event listener. Returns an unsubscribe function. [Wiki](https://github.com/greydragon888/router6/wiki/addEventListener)

```typescript
import { events } from "router6";

router.addEventListener(events.TRANSITION_START, (toState, fromState) => {
  console.log("Starting:", toState.name);
});

// Available events:
// ROUTER_START, ROUTER_STOP
// TRANSITION_START, TRANSITION_SUCCESS, TRANSITION_ERROR, TRANSITION_CANCEL
```

---

### Plugins

#### `router.usePlugin(pluginFactory)`

Registers a plugin. Returns an unsubscribe function. [Wiki](https://github.com/greydragon888/router6/wiki/usePlugin)

```typescript
import { browserPlugin } from "router6-plugin-browser";

const unsubscribe = router.usePlugin(browserPlugin());
```

---

### Middleware

#### `router.useMiddleware(middlewareFactory)`

Registers middleware for the navigation pipeline. [Wiki](https://github.com/greydragon888/router6/wiki/useMiddleware)

```typescript
router.useMiddleware((router) => (toState, fromState, done) => {
  console.log("Navigating:", toState.name);
  done();
});
```

---

## Advanced API

### Routes

#### `router.addRoute(route: Route): void`
Add a route definition at runtime.\
[Wiki](https://github.com/greydragon888/router6/wiki/addRoute)

#### `router.removeRoute(name: string): void`
Remove a route by name.\
[Wiki](https://github.com/greydragon888/router6/wiki/removeRoute)

#### `router.getRoute(name: string): Route | undefined`
Get route definition by name.\
[Wiki](https://github.com/greydragon888/router6/wiki/getRoute)

#### `router.hasRoute(name: string): boolean`
Check if a route exists.\
[Wiki](https://github.com/greydragon888/router6/wiki/hasRoute)

#### `router.clearRoutes(): void`
Remove all routes.\
[Wiki](https://github.com/greydragon888/router6/wiki/clearRoutes)

#### `router.forward(fromRoute: string, toRoute: string): void`
Set up route forwarding (redirect).\
[Wiki](https://github.com/greydragon888/router6/wiki/forward)

---

### State Utilities

#### `router.getPreviousState(): State | undefined`
Get previous router state.\
[Wiki](https://github.com/greydragon888/router6/wiki/getPreviousState)

#### `router.setState(state: State): void`
Set state directly without navigation.\
[Wiki](https://github.com/greydragon888/router6/wiki/setState)

#### `router.makeState(name: string, params?, path?, meta?): State`
Create a state object.\
[Wiki](https://github.com/greydragon888/router6/wiki/makeState)

#### `router.buildState(name: string, params?): State | undefined`
Build state from route name.\
[Wiki](https://github.com/greydragon888/router6/wiki/buildState)

#### `router.areStatesEqual(state1, state2, ignoreQueryParams?): boolean`
Compare two states for equality.\
[Wiki](https://github.com/greydragon888/router6/wiki/areStatesEqual)

#### `router.areStatesDescendants(parentState, childState): boolean`
Check if child state is descendant of parent.\
[Wiki](https://github.com/greydragon888/router6/wiki/areStatesDescendants)

---

### Path Operations

#### `router.buildPath(name: string, params?): string`
Build URL path from route name.\
[Wiki](https://github.com/greydragon888/router6/wiki/buildPath)

#### `router.matchPath(path: string): State | undefined`
Match URL path to state.\
[Wiki](https://github.com/greydragon888/router6/wiki/matchPath)

#### `router.isActiveRoute(name, params?, strictEquality?, ignoreQueryParams?): boolean`
Check if route is currently active.\
[Wiki](https://github.com/greydragon888/router6/wiki/isActiveRoute)

#### `router.setRootPath(rootPath: string): void`
Set root path prefix for all routes.\
[Wiki](https://github.com/greydragon888/router6/wiki/setRootPath)

---

### Dependencies

#### `router.getDependencies(): Dependencies`
Get all dependencies.\
[Wiki](https://github.com/greydragon888/router6/wiki/getDependencies)

#### `router.setDependency(name: string, value: unknown): void`
Set a dependency.\
[Wiki](https://github.com/greydragon888/router6/wiki/setDependency)

#### `router.getDependency(name: string): unknown`
Get a dependency by name.\
[Wiki](https://github.com/greydragon888/router6/wiki/getDependency)

---

### Options

#### `router.getOptions(): Options`
Get router options.\
[Wiki](https://github.com/greydragon888/router6/wiki/getOptions)

#### `router.setOption(name: string, value: unknown): void`
Set a router option. Must be called before `start()`.\
[Wiki](https://github.com/greydragon888/router6/wiki/setOption)

---

### Other

#### `router.clone(dependencies?): Router`
Clone router for SSR.\
[Wiki](https://github.com/greydragon888/router6/wiki/clone)

#### `router.isNavigating(): boolean`
Check if navigation is in progress.\
[Wiki](https://github.com/greydragon888/router6/wiki/isNavigating)

#### `router.clearMiddleware(): void`
Clear all middleware.\
[Wiki](https://github.com/greydragon888/router6/wiki/clearMiddleware)

#### `router.clearCanActivate(name: string): void`
Clear activation guard for a route.\
[Wiki](https://github.com/greydragon888/router6/wiki/clearCanActivate)

#### `router.clearCanDeactivate(name: string): void`
Clear deactivation guard for a route.\
[Wiki](https://github.com/greydragon888/router6/wiki/clearCanDeactivate)

---

## Configuration

```typescript
interface Options {
  defaultRoute: string;            // Default route name (default: "")
  defaultParams: Params;           // Default route params (default: {})
  trailingSlash: "strict" | "never" | "always" | "preserve";  // (default: "preserve")
  caseSensitive: boolean;          // Case-sensitive matching (default: false)
  urlParamsEncoding: "default" | "uri" | "uriComponent" | "none";  // (default: "default")
  queryParamsMode: "default" | "strict" | "loose";  // (default: "loose")
  queryParams?: QueryParamsOptions; // Query parameter parsing options
  allowNotFound: boolean;          // Allow navigation to unknown routes (default: true)
  rewritePathOnMatch: boolean;     // Rewrite path on successful match (default: false)
}
```

See [RouterOptions](https://github.com/greydragon888/router6/wiki/RouterOptions) for detailed documentation.

---

## Observable Support

The router implements the [TC39 Observable](https://github.com/tc39/proposal-observable) interface:

```typescript
import { from } from "rxjs";

from(router).subscribe(({ route, previousRoute }) => {
  console.log("Route changed:", route.name);
});
```

See [Symbol.observable](https://github.com/greydragon888/router6/wiki/observable) for details.

---

## Error Handling

Navigation errors are instances of `RouterError`:

```typescript
import { RouterError, errorCodes } from "router6";

router.navigate("users", {}, {}, (err, state) => {
  if (err instanceof RouterError) {
    console.log(err.code, err.message);
  }
});
```

| Code                | Description                    |
| ------------------- | ------------------------------ |
| `ROUTE_NOT_FOUND`   | Route doesn't exist            |
| `CANNOT_ACTIVATE`   | Blocked by canActivate guard   |
| `CANNOT_DEACTIVATE` | Blocked by canDeactivate guard |
| `CANCELLED`         | Navigation was cancelled       |
| `SAME_STATES`       | Already at target route        |
| `NOT_STARTED`       | Router not started             |
| `ALREADY_STARTED`   | Router already started         |

See [RouterError](https://github.com/greydragon888/router6/wiki/RouterError) and [Error Codes](https://github.com/greydragon888/router6/wiki/error-codes) for details.

---

## Documentation

Full documentation on [Wiki](https://github.com/greydragon888/router6/wiki):

- [createRouter](https://github.com/greydragon888/router6/wiki/createRouter) — factory function
- [start](https://github.com/greydragon888/router6/wiki/start) · [stop](https://github.com/greydragon888/router6/wiki/stop) — lifecycle
- [navigate](https://github.com/greydragon888/router6/wiki/navigate) — navigation
- [State](https://github.com/greydragon888/router6/wiki/State) — state type
- [Route](https://github.com/greydragon888/router6/wiki/Route) — route definition
- [Plugins](https://github.com/greydragon888/router6/wiki/Plugins) — plugin system
- [Middleware](https://github.com/greydragon888/router6/wiki/Middleware) — middleware system

---

## Related Packages

- [router6-react](https://www.npmjs.com/package/router6-react) — React integration
- [router6-plugin-browser](https://www.npmjs.com/package/router6-plugin-browser) — Browser history
- [router6-plugin-logger](https://www.npmjs.com/package/router6-plugin-logger) — Debug logging
- [router6-plugin-persistent-params](https://www.npmjs.com/package/router6-plugin-persistent-params) — Persistent params
- [router6-helpers](https://www.npmjs.com/package/router6-helpers) — Utilities

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
