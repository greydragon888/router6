import { createRouter } from 'router5'
import persistentParamsPlugin from '..'
import type { Router } from 'router5'

let router: Router
const createTestRouter = () =>
    createRouter([
        { name: 'route1', path: '/route1/:id' },
        { name: 'route2', path: '/route2/:id' }
    ])

describe('Persistent params plugin', () => {
    describe('with an array', () => {
      beforeEach(() => {
        router = createTestRouter()

        router.usePlugin(persistentParamsPlugin(['mode']))
      })
      afterEach(() => {
        router.stop()
      })

        it('should persist specified parameters', () => new Promise(done => {
            router.start('route1')
            router.navigate('route2', { id: '2' }, {}, (_err, state) => {
                expect(state.path).toBe('/route2/2')
                router.navigate(
                    'route1',
                    { id: '1', mode: 'dev' },
                    {},
                    (err, state) => {
                        expect(state.path).toBe('/route1/1?mode=dev')

                        router.navigate(
                            'route2',
                            { id: '2' },
                            {},
                            (_err, state) => {
                                expect(state.path).toBe('/route2/2?mode=dev')
                                done(null)
                            }
                        )
                    }
                )
            })
        }))

        it('should save value on start', () => new Promise(done => {
            router.stop()
            router.start('/route2/1?mode=dev', (_err, state) => {
                expect(state.params).toEqual({ mode: 'dev', id: '1' })

                router.navigate('route2', { id: '2' }, {}, (_err, state) => {
                    expect(state.path).toBe('/route2/2?mode=dev')
                    done(null)
                })
            })
        }))
    })

    describe('with an object', () => {
        beforeAll(() => {
            router.stop()
            router = createTestRouter()
        })

        it('should be registered with params', () => {
            router.usePlugin(persistentParamsPlugin({ mode: 'dev' }))
        })

        it('should persist specified parameters', () => new Promise(done => {
            router.start()
            router.navigate('route1', { id: '1' }, {}, (_err, state) => {
                expect(state.path).toBe('/route1/1?mode=dev')
                done(null)
            })
        }))
    })
})
