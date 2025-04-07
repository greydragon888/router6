import { createTestRouter } from './helpers'

describe('core/observable', function() {
    let router

    beforeAll(() => (router = createTestRouter().start()))
    afterAll(() => router.stop())

    it('should accept a listener function', () => {
        const unsubscribe = router.subscribe(() => {})

        expect(typeof unsubscribe).toBe('function')
    })

    it('should accept a listener object', () => {
        const subscription = router.subscribe({
            next: () => {}
        })

        expect(typeof subscription.unsubscribe).toBe('function')
    })
})
