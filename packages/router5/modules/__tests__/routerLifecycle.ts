import { errorCodes } from '..'
import { createTestRouter, omitMeta } from './helpers'
import type { Router, State } from '..'

let router: Router
const homeState: State = {
    name: 'home',
    params: {},
    path: '/home',
    meta: { id: 5, params: { home: {} }, redirected: false, options: {} }
}

describe('core/router-lifecycle', () => {
    beforeEach(() => {
      router = createTestRouter()
    })
    afterEach(() => {
      router.stop()
    })

    it('should start with the default route', () => new Promise((done) => {
        expect(router.getState()).toBe(null)
        expect(router.isActive('home')).toBe(false)

        router.start('/not-existing', () => {
            expect(router.isStarted()).toBe(true)
            expect(omitMeta(router.getState())).toEqual({
                name: 'home',
                params: {},
                path: '/home'
            })

            done(null)
        })
    }))

    it('should throw an error when starting with no start path or state', () => new Promise((done) => {
        router.setOption('defaultRoute', null)
        router.start(err => {
            expect(err.code).toBe(errorCodes.NO_START_PATH_OR_STATE)
            router.setOption('defaultRoute', 'home')

            done(null)
        })
    }))

    it('should not throw an error when starting with no callback', () => {
        expect(() => router.start('')).not.toThrow()
    })

    it('should give an error if trying to start when already started', () => {
      router.start('', () => {
        router.start('', (err) => {
            expect(err.code).toBe(errorCodes.ROUTER_ALREADY_STARTED)
        })
      })
    })

    it('should start with the start route if matched', () => new Promise((done) => {
        router.start('/section123/query?param1=1__1&param1=2__2', (
            _err,
            state
        ) => {
            expect(omitMeta(state)).toEqual({
                name: 'section.query',
                params: { section: 'section123', param1: ['1__1', '2__2'] },
                path: '/section123/query?param1=1__1&param1=2__2'
            })

            done(null)
        })
    }))

    it('should start with the default route if start route is not matched', () => new Promise((done) => {
        router.start('/about', () => {
            expect(omitMeta(router.getState())).toEqual({
                name: 'home',
                params: {},
                path: '/home'
            })

            done(null)
        })
    }))

    it('should start with the default route if navigation to start route is not allowed', () => new Promise((done) => {
        router.start('/admin', () => {
            expect(omitMeta(router.getState())).toEqual({
                name: 'home',
                params: {},
                path: '/home'
            })

            done(null)
        })
    }))

    it('should start with the provided path', () => new Promise((done) => {
        router.start('/users', (_err, state) => {
            expect(omitMeta(state)).toEqual({
                name: 'users',
                params: {},
                path: '/users'
            })

            done(null)
        })
    }))

    it('should start with an error if navigation to start route is not allowed and no default route is specified', () => new Promise((done) => {
        router.setOption('defaultRoute', null)
        router.start('/admin', (err) => {
            expect(err.code).toBe(errorCodes.CANNOT_ACTIVATE)
            expect(err.segment).toBe('admin')

            done(null)
        })
    }))

    it('should start with a not found error if no matched start state and no default route', () => new Promise((done) => {
        router.setOption('defaultRoute', null)

        router.start('/not-existing', (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND)

            done(null)
        })
    }))

    it('should not match an URL with extra trailing slashes', () => new Promise((done) => {
        // ToDo: WHY?
        router.setOption('defaultRoute', null)
        router.setOption('strictTrailingSlash', true)

        router.start('/users/list/', (err, state) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND)
            expect(state).toBe(null)

            done(null)
        })
    }))

    it('should match an URL with extra trailing slashes', () => new Promise((done) => {
        router.start('/users/list/', (_err, state) => {
            expect(omitMeta(state)).toEqual({
                name: 'users.list',
                params: {},
                path: '/users/list'
            })

            done(null)
        })
    }))

    it('should start with the provided state', () => new Promise((done) => {
        router.start(homeState as State, (_err, state) => {
            expect(state).toEqual(homeState)
            expect(router.getState()).toEqual(homeState)

            done(null)
        })
    }))

    it('should not reuse id when starting with provided state', () => new Promise((done) => {
        router.start(homeState as State, (_err, state) => {
          expect(state.meta.id).toEqual(homeState.meta.id)

          router.navigate('users', (_err, state: State) => {
              expect(state.meta.id).toEqual(1)

              router.navigate('profile', (_err, state: State) => {
                expect(state.meta.id).not.toEqual(1)
                expect(state.meta.id).not.toEqual(homeState.meta.id)

                done(null)
              })
          })
        })
    }))

    it('should return an error if default route access is not found', () => new Promise((done) => {
        router.setOption('defaultRoute', 'fake.route')

        router.start('/not-existing', (err) => {
            expect(err.code).toBe(errorCodes.ROUTE_NOT_FOUND)

            done(null)
        })
    }))

    it('should be able to stop routing', () => new Promise((done) => {
        router.start()

        router.navigate('users', () => {
            router.stop()

            expect(router.isStarted()).toBe(false)

            router.navigate('users.list', (err) => {
                expect(err.code).toBe(errorCodes.ROUTER_NOT_STARTED)

                // Stopping again shouldn't throw an error
                router.stop()

                router.start('', () => done(null))
            })
        })
    }))
})
