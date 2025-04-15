# helpers

Helpers for comparing and checking routes.

## API

_route can be a route name (string) or state object containing a name property_

- **startsWithSegment(route, segment)**
- **endsWithSegment(route, segment)**
- **includesSegment(route, segment)**

**redirect function**

This package also contains a redirect function for `onActivate` handlers.

- **redirect(fromRouteName, toRouteName, toRouteParams)**, where toRouteParams can an object or a function of the attempted route params.

### All functions are available in their curried form (kinda)

- **startsWithSegment(route)(segment)**
- **endsWithSegment(route)(segment)**
- **includesSegment(route)(segment)**
- **redirect(fromRouteName)(toRouteName, toRouteParams)**

```javascript
import * as helpers from "router5-helpers";

startsWithSegment("users", "users"); // => true
startsWithSegment("users.list", "users"); // => true

startsWithSegment("users.list")("users"); // => true
```
