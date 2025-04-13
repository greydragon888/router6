import { createTestRouter, FnChild, renderWithRouter } from './helpers'
import { useRoute } from 'react-router5'
import type { Router } from 'router5'

let router: Router

describe('useRoute hook', () => {
  beforeEach(() => {
    router = createTestRouter()
  })

  it('should inject the router in the wrapped component props', () => {
    const ChildSpy = vi.fn(FnChild)

    renderWithRouter(router)(() => {
      return ChildSpy(useRoute())
    })

    expect(ChildSpy).toHaveBeenCalledWith({
      router,
      route: null,
      previousRoute: null
    })
  })
})
