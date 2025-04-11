import { BaseLink } from './BaseLink'
import { useRoute } from 'react-router5'
import type { FC } from 'react'
import type { BaseLinkProps } from './interfaces'

export const ConnectedLink: FC<Omit<BaseLinkProps, 'router' | 'route' | 'previousRoute'>> = (props) => {
  const { router, route, previousRoute } = useRoute();

  return (
    <BaseLink
      router={router}
      route={route}
      previousRoute={previousRoute}
      {...props}
    />
  )
};
