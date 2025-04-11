import { BaseLink } from './BaseLink'
import { useRouter } from 'react-router5'
import type { FC } from 'react'
import type { BaseLinkProps } from './interfaces'

export const Link: FC<Omit<BaseLinkProps, 'router'>> = (props) => {
  const router = useRouter();

  return <BaseLink router={router} {...props} />
};
