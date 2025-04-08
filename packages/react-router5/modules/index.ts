import RouterProvider from './RouterProvider'
export { routerContext, routeContext } from './context'
import BaseLink from './BaseLink'
import RouteNode from './render/RouteNode'
import useRouter from './hooks/useRouter'
import useRoute from './hooks/useRoute'
import useRouteNode from './hooks/useRouteNode'
import { routerContext, routeContext } from './context'

// const ConnectedLink = withRoute(BaseLink)
// const Link = withRouter(BaseLink)

const Router = routerContext.Consumer
const Route = routeContext.Consumer

export {
    RouterProvider,
    BaseLink,
    // Render props
    Router,
    Route,
    RouteNode,
    // Hooks
    useRouter,
    useRoute,
    useRouteNode
}
