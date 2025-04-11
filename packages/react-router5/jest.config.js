module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    preset: 'ts-jest',
    testPathIgnorePatterns: ['<rootDir>/modules/__tests__/helpers/.*\\.tsx?$'],
}
