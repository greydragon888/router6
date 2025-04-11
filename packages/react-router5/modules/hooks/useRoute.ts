import { useContext } from 'react'
import { RouteContext } from '../context'
import { RouteContext as RouteContextType } from '../types'

export const useRoute = (): RouteContextType => {
    return useContext(RouteContext)
}
