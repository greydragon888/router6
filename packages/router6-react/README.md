# router6-react

[![npm version](https://badge.fury.io/js/router6-react.svg)](https://www.npmjs.com/package/router6-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)

React integration for Router6 — hooks, components, and context providers.

## Installation

```bash
npm install router6-react router6 router6-plugin-browser
# or
pnpm add router6-react router6 router6-plugin-browser
# or
yarn add router6-react router6 router6-plugin-browser
# or
bun add router6-react router6 router6-plugin-browser
```

**Peer Dependencies:** `react` >= 18.0.0

## Quick Start

```tsx
import { createRouter } from "router6";
import { browserPlugin } from "router6-plugin-browser";
import { RouterProvider, useRoute, Link } from "router6-react";
import { createRoot } from "react-dom/client";

// Define routes
const routes = [
  { name: "home", path: "/" },
  { name: "users", path: "/users" },
  { name: "users.profile", path: "/:id" },
];

// Create and configure router
const router = createRouter(routes);
router.usePlugin(browserPlugin());
router.start();

// App component
function App() {
  const { route } = useRoute();

  return (
    <div>
      <nav>
        <Link routeName="home">Home</Link>
        <Link routeName="users">Users</Link>
      </nav>
      <main>
        <h1>Current route: {route?.name}</h1>
      </main>
    </div>
  );
}

// Render with provider
createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router}>
    <App />
  </RouterProvider>,
);
```

---

## API Reference

### Provider

#### `<RouterProvider router={router}>`
Provides router instance to component tree via React Context.\
`router: Router` — router instance from `createRouter()`\
`children: ReactNode` — child components\
[Wiki](https://github.com/greydragon888/router6/wiki/RouterProvider)

```tsx
<RouterProvider router={router}>
  <App />
</RouterProvider>
```

---

### Hooks

#### `useRouter(): Router`
Get router instance. **Never re-renders** on navigation.\
Returns: `Router` — router instance\
[Wiki](https://github.com/greydragon888/router6/wiki/useRouter)

```tsx
import { useRouter } from "router6-react";

const NavigateButton = () => {
  const router = useRouter();

  return <button onClick={() => router.navigate("home")}>Go Home</button>;
}
```

#### `useRoute(): { router, route, previousRoute }`
Get current route state. **Re-renders on every navigation.**\
Returns: `{ router: Router, route: State | undefined, previousRoute: State | undefined }`\
[Wiki](https://github.com/greydragon888/router6/wiki/useRoute)

```tsx
import { useRoute } from "router6-react";

const CurrentRoute = () => {
  const { router, route, previousRoute } = useRoute();

  return (
    <div>
      <p>Current: {route?.name}</p>
      <p>Previous: {previousRoute?.name}</p>
      <p>Params: {JSON.stringify(route?.params)}</p>
      <button onClick={() => router.navigate("home")}>Go Home</button>
    </div>
  );
}
```

#### `useRouteNode(nodeName: string): { router, route, previousRoute }`
Optimized hook for nested routes. **Re-renders only when specified node changes.**\
`nodeName: string` — route segment to observe (e.g., `"users"`)\
Returns: `{ router: Router, route: State | undefined, previousRoute: State | undefined }`\
[Wiki](https://github.com/greydragon888/router6/wiki/useRouteNode)

```tsx
import { useRouteNode } from "router6-react";

const UsersSection = () => {
  // Only re-renders when routes starting with "users" change
  const { router, route, previousRoute } = useRouteNode("users");

  // route is undefined when current route is NOT under "users" node
  if (!route) {
    return null;
  }

  switch (route.name) {
    case "users":
      return <UsersList />;
    case "users.profile":
      return <UserProfile id={route.params.id} />;
    default:
      return null;
  }
}
```

---

### Components

#### `<Link routeName={string} routeParams={object} ...props>`
Navigation link with automatic active state detection.\
`routeName: string` — target route name\
`routeParams?: Params` — route parameters\
`routeOptions?: { reload?, replace? }` — navigation options\
`activeClassName?: string` — class when active (default: `"active"`)\
`activeStrict?: boolean` — exact match only (default: `false`)\
`ignoreQueryParams?: boolean` — ignore query params in active check (default: `true`)\
[Wiki](https://github.com/greydragon888/router6/wiki/Link)

```tsx
import { Link } from "router6-react";

<Link
  routeName="users.profile"
  routeParams={{ id: "123" }}
  activeClassName="active"
  activeStrict={false}
>
  View Profile
</Link>
```

#### `<ConnectedLink ...props>`
Same as `Link`, but re-renders on every route change.\
Props: same as `Link`\
[Wiki](https://github.com/greydragon888/router6/wiki/ConnectedLink)

#### `<BaseLink router={router} ...props>`
Low-level link component. Requires router instance as prop.\
`router: Router` — router instance\
Props: same as `Link`\
[Wiki](https://github.com/greydragon888/router6/wiki/BaseLink)

---

## Migration from react-router5

| API                                           | react-router5 | router6-react      |
| --------------------------------------------- | ------------- | ------------------ |
| `RouterProvider`                              | ✓             | ✓                  |
| `Link`, `ConnectedLink`, `BaseLink`           | ✓             | ✓                  |
| `useRouter`, `useRoute`, `useRouteNode`       | ✓             | ✓                  |
| `withRouter`, `withRoute`, `routeNode`        | ✓             | ❌ Use hooks       |
| `Router`, `Route`, `RouteNode` (render props) | ✓             | ❌ Use hooks       |

See [Wiki](https://github.com/greydragon888/router6/wiki/Migration-from-react-router5) for detailed migration guide.

---

## Documentation

Full documentation on [Wiki](https://github.com/greydragon888/router6/wiki):

- [RouterProvider](https://github.com/greydragon888/router6/wiki/RouterProvider)
- [useRouter](https://github.com/greydragon888/router6/wiki/useRouter)
- [useRoute](https://github.com/greydragon888/router6/wiki/useRoute)
- [useRouteNode](https://github.com/greydragon888/router6/wiki/useRouteNode)
- [Link](https://github.com/greydragon888/router6/wiki/Link)

---

## Related Packages

- [router6](https://www.npmjs.com/package/router6) — Core router
- [router6-plugin-browser](https://www.npmjs.com/package/router6-plugin-browser) — Browser history

## License

MIT © [Oleg Ivanov](https://github.com/greydragon888)
