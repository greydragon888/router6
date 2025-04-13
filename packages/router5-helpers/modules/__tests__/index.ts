import * as helpers from '../'

describe('router5-helpers', () => {
    describe('.startsWithSegment()', () => {
        it('should return true if a route starts with a segment', () => {
            expect(helpers.startsWithSegment('a.b.c', 'a')).toBe(true)
            expect(helpers.startsWithSegment('a.b.c', 'a.b')).toBe(true)
            expect(helpers.startsWithSegment({ name: 'a.b.c' }, 'a')).toBe(true)
        })

        it('should return false if a route does not start with a segment', () => {
            expect(helpers.startsWithSegment('a.b.c', 'aa')).toBe(false)
            expect(helpers.startsWithSegment('a.b.c', 'a.a')).toBe(false)
            expect(helpers.startsWithSegment({ name: 'a.b.c' }, 'aa')).toBe(
                false
            )
        })
    })

    describe('.endsWithSegment()', () => {
        it('should return true if a route ends with a segment', () => {
            expect(helpers.endsWithSegment('a.b.c', 'c')).toBe(true)
            expect(helpers.endsWithSegment({ name: 'a.b.c' }, 'c')).toBe(true)
        })

        it('should return false if a route does not end with a segment', () => {
            expect(helpers.endsWithSegment('a.b.c', 'cc')).toBe(false)
            expect(helpers.endsWithSegment({ name: 'a.b.c' }, 'cc')).toBe(false)
        })
    })

    describe('.includesSegment()', () => {
        it('should return true if a route includes a segment', () => {
            expect(helpers.includesSegment('a.b.c', 'a')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'a.b')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'a.b.c')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'b')).toBe(true)
            expect(helpers.includesSegment('a.b.c', 'c')).toBe(true)
        })

        it('should return false if a route does not include a segment', () => {
            expect(helpers.includesSegment('a.b.c', 'aa')).toBe(false)
            expect(helpers.includesSegment('a.bb.c', 'a.b')).toBe(false)
            expect(helpers.includesSegment('a.b.c', 'bb.c')).toBe(false)
            expect(helpers.includesSegment('a.b.c', 'a.b.b')).toBe(false)
        })
    })
})
