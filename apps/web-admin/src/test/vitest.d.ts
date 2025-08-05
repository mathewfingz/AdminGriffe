/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

declare module 'vitest' {
  interface Assertion<T = unknown> extends jest.Matchers<void>, TestingLibraryMatchers<T, HTMLElement> {}
  interface AsymmetricMatchersContaining extends jest.Matchers<void>, TestingLibraryMatchers<unknown, HTMLElement> {}
}