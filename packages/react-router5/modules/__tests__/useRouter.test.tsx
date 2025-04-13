import { createTestRouter, FnChild, renderWithRouter } from './helpers'
import { useRouter } from 'react-router5'
import type { Router } from 'router5'

let router: Router

describe('useRouter hook', () => {
  beforeEach(() => {
    router = createTestRouter()
  })
  afterEach(() => {
    router.stop()
  })

  it('should inject the router on the wrapped component props', () => {
    const ChildSpy = vi.fn(FnChild)

    //@ts-ignore
    renderWithRouter(router)(() => {
      return ChildSpy({ router: useRouter() })
    })

    expect(ChildSpy).toHaveBeenCalledWith({
      router
    })
  })
})
