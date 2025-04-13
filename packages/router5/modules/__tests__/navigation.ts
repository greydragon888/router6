import { constants, errorCodes, createRouter } from '..'
import { createTestRouter, omitMeta } from './helpers'
import type { Router } from '..'

let router: Router
const noop = () => {}

describe('core/navigation', () => {
    beforeEach(() => {
        router = createTestRouter().start()
    })

    afterEach(() => {
      router.stop()

      vi.clearAllMocks()
    })

    it('should be able to navigate to routes', () => new Promise(done => {
        router.navigate('users.view', { id: 123 }, {}, (_err, state) => {
            expect(omitMeta(state)).toEqual({
                name: 'users.view',
                params: { id: 123 },
                path: '/users/view/123'
            })
            done(null)
        })
    }))

    it('should navigate to same state if reload is set to true', () => new Promise(done => {
        router.navigate('orders.pending', () => {
            router.navigate('orders.pending', (err) => {
                expect(err.code).toBe(errorCodes.SAME_STATES)

                router.navigate(
                    'orders.pending',
                    {},
                    { reload: true },
                    (err) => {
                        expect(err).toBe(null)
                        done(null)
                    }
                )
            })
        })
    }))

    it('should be able to cancel a transition', () => new Promise(done => {
        router.canActivate('admin', () => () => Promise.resolve())
        const cancel = router.navigate('admin', (err) => {
            expect(err.code).toBe(errorCodes.TRANSITION_CANCELLED)
            done(null)
        })
        cancel()
    }))

    it('should be able to handle multiple cancellations', () => new Promise(done => {
        router.useMiddleware(() => (_toState, _fromState, done) => {
            setTimeout(done, 20)
        })
        router.navigate('users', err => {
            expect(err.code).toBe(errorCodes.TRANSITION_CANCELLED)
        })
        router.navigate('users', err => {
            expect(err.code).toBe(errorCodes.TRANSITION_CANCELLED)
        })
        router.navigate('users', err => {
            expect(err.code).toBe(errorCodes.TRANSITION_CANCELLED)
        })
        router.navigate('users', () => {
            router.clearMiddleware()
            done(null)
        })
    }))

    it('should redirect if specified by transition error, and call back', () => new Promise(done => {
        router.stop()
        router.start('/auth-protected', (_err, state) => {
            expect(omitMeta(state)).toEqual({
                name: 'sign-in',
                params: {},
                path: '/sign-in'
            })
            router.navigate('auth-protected', (_err, state) => {
                expect(omitMeta(state)).toEqual({
                    name: 'sign-in',
                    params: {},
                    path: '/sign-in'
                })
                done(null)
            })
        })
    }))

    it('should pass along handled errors in promises', () => new Promise(done => {
        router.clearMiddleware()
        router.stop()
        router.canActivate('admin', () => () =>
            Promise.resolve(new Error('error message'))
        )
        router.start('', () => {
            router.navigate('admin', (err) => {
                expect(err.code).toBe(errorCodes.CANNOT_ACTIVATE)
                expect(err.error.message).toBe('error message')
                done(null)
            })
        })
    }))

    it('should pass along handled errors in promises', () => new Promise(done => {
        vi.spyOn(console, 'error').mockImplementation(noop)
        router.stop()
        router.canActivate('admin', () => () =>
            new Promise(() => {
                throw new Error('unhandled error')
            })
        )
        router.start('', () => {
            router.navigate('admin', (err) => {
                expect(err.code).toBe(errorCodes.CANNOT_ACTIVATE)
                expect(console.error).toHaveBeenCalled()
                done(null)
            })
        })
    }))

    it('should prioritise cancellation errors', () => new Promise(done => {
        router.stop()
        router.canActivate('admin', () => () =>
            new Promise((_resolve, reject) => {
                setTimeout(() => reject(), 20)
            })
        )
        router.start('', () => {
            const cancel = router.navigate('admin', (err) => {
                expect(err.code).toBe(errorCodes.TRANSITION_CANCELLED)
                done(null)
            })
            setTimeout(cancel, 10)
        })
    }))

    it('should let users navigate to unkown URLs if allowNotFound is set to true', () => new Promise(done => {
        router.setOption('allowNotFound', true)
        router.setOption('defaultRoute', undefined)
        router.stop()
        router.start('/unkown-url', (_err, state) => {
            expect(state.name).toBe(constants.UNKNOWN_ROUTE)
            done(null)
        })
    }))

    it('should forward a route to another route', () => new Promise(done => {
        router.forward('profile', 'profile.me')

        router.navigate('profile', (_err, state) => {
            expect(state.name).toBe('profile.me')
            router.forward('profile', undefined)
            done(null)
        })
    }))

    it('should forward a route to another with default params', () => new Promise(done => {
        const routerTest = createRouter([
            {
                name: 'app',
                path: '/app',
                forwardTo: 'app.version',
                defaultParams: {
                    lang: 'en'
                }
            },
            {
                name: 'app.version',
                path: '/:version',
                defaultParams: { version: 'v1' }
            }
        ])

        routerTest.start('/app', (_err, state) => {
            expect(state.name).toBe('app.version')
            expect(state.params).toEqual({
                version: 'v1',
                lang: 'en'
            })
            done(null)
        })
    }))

    it('should encode params to path', () => new Promise(done => {
        router.navigate(
            'withEncoder',
            { one: 'un', two: 'deux' },
            (_err, state) => {
                expect(state.path).toEqual('/encoded/un/deux')
                done(null)
            }
        )
    }))

    it('should extend default params', () => {
        router.navigate('withDefaultParam', (_err, state) => {
            expect(state.params).toEqual({
                param: 'hello'
            })
        })
    })

    it('should add navitation options to meta', () => {
        const options = { reload: true, replace: true, customOption: 'abc' }
        router.navigate('profile', {}, options, (_err, state) => {
            expect(state.meta.options).toEqual(options)
        })
    })
})
