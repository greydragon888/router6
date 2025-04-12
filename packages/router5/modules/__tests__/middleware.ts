import createTestRouter from './helpers/testRouters'
import { errorCodes } from '..'
import type { Router } from '..'

const listeners = {
    transition: (toState, _fromState, done) => {
        const newState = {
            name: toState.name,
            params: toState.params,
            path: toState.path,
            hitMware: true
        }
        done(null, newState)
    },
    transitionMutate: (toState, _fromState, done) => {
        const newState = {
            name: toState.name + 'modified',
            params: toState.params,
            path: toState.path,
            hitMware: true
        }
        done(null, newState)
    },
    transitionErr: (_toState, _fromState, done) => {
        done({ reason: 'because' })
    },
}

describe('core/middleware', () => {
    let router: Router

    beforeEach(() => (router = createTestRouter().start()))
    afterEach(() => {
        vi.restoreAllMocks()
        router.stop()
    })

    it('should support a transition middleware', () => new Promise(done => {
        vi.spyOn(listeners, 'transition')
        router.stop()
        router.useMiddleware(() => listeners.transition)
        router.start('', () => {
            router.navigate('users', function(err, state) {
                expect(listeners.transition).toHaveBeenCalled()
                expect(state.hitMware).toEqual(true)
                expect(err).toEqual(null)
                done(null)
            })
        })
    }))

    it('should log a warning if state is changed during transition', () => new Promise(done => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        router.stop()
        router.useMiddleware(() => listeners.transitionMutate)
        router.start('', () => {
            router.navigate('orders', function(err) {
                expect(console.error).toHaveBeenCalled()
                expect(err).toEqual(null)
                router.clearMiddleware()
                done(null)
            })
        })
    }))

    it('should fail transition if middleware returns an error', () => new Promise(done => {
        vi.spyOn(listeners, 'transitionErr')
        router.stop()
        router.useMiddleware(() => listeners.transitionErr)
        router.start('', () => {
            router.navigate('users', function(err) {
                expect(listeners.transitionErr).toHaveBeenCalled()
                expect(err.code).toEqual(errorCodes.TRANSITION_ERR)
                expect(err.reason).toEqual('because')
                done(null)
            })
        })
    }))

    it('should be able to take more than one middleware', () => new Promise(done => {
        vi.spyOn(listeners, 'transition')
        vi.spyOn(listeners, 'transitionErr')
        router.stop()
        router.clearMiddleware()
        router.useMiddleware(
            () => listeners.transition,
            () => listeners.transitionErr
        )
        router.start('', () => {
            router.navigate('users', function() {
                expect(listeners.transition).toHaveBeenCalled()
                expect(listeners.transitionErr).toHaveBeenCalled()
                done(null)
            })
        })
    }))

    it('should pass state from middleware to middleware', () => new Promise(done => {
        const m1 = () => (toState, _fromState, done) => {
            done(null, { ...toState, m1: true })
        }
        const m2 = () => toState =>
            Promise.resolve({ ...toState, m2: toState.m1 })

        const m3 = () => (toState, _fromState, done) => {
            done(null, { ...toState, m3: toState.m2 })
        }
        router.clearMiddleware()
        router.useMiddleware(m1, m2, m3)

        router.start('', () => {
            router.navigate('users', function(_err, state) {
                expect(state.m1).toEqual(true)
                expect(state.m2).toEqual(true)
                expect(state.m3).toEqual(true)

                done(null)
            })
        })
    }))
})
