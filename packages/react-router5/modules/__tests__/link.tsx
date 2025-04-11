import React from 'react'
import { createTestRouter } from './helpers'
import { BaseLink, ConnectedLink, Link, RouterProvider } from '..'
import { render, screen } from '@testing-library/react'
import type { Router } from 'router5'
import { userEvent } from '@testing-library/user-event'

const TEST_TEXT = 'Test text'

describe('Link component', () => {
    let router: Router

    beforeAll(() => {
        router = createTestRouter()
    })

    it('should render an hyperlink element', () => {
        router.addNode('home', '/home')
        render(
          <BaseLink router={router} routeName={'home'}>{TEST_TEXT}</BaseLink>
        )
        expect(screen.queryByText(TEST_TEXT).getAttribute('href')).toBe('/home')
        expect(screen.queryByText(TEST_TEXT).getAttribute('class')).not.toContain('active')
    })

  it('should render an hyperlink element', () => {
      router.addNode('home', '/home')
      render(
          <RouterProvider router={router}>
              <Link routeName={'home'}>{TEST_TEXT}</Link>
          </RouterProvider>
      )
      expect(screen.queryByText(TEST_TEXT).getAttribute('href')).toBe('/home')
      expect(screen.queryByText(TEST_TEXT).getAttribute('class')).not.toContain('active')
  })

  it('should have anctive class if associated route is active', () => {
      router.setOption('defaultRoute', 'home')
      router.start()
      render(
          <RouterProvider router={router}>
              <Link routeName={'home'}>{TEST_TEXT}</Link>
          </RouterProvider>
      )
      expect(screen.queryByText(TEST_TEXT).getAttribute('class')).toContain('active')
  })

  it('should not call router’s navigate method when used with target="_blank"', async () => {
      router.start()
      render(
          <RouterProvider router={router}>
              <ConnectedLink routeName="home" title="Hello" target="_blank">{TEST_TEXT}</ConnectedLink>
          </RouterProvider>
      )
      const a = screen.queryByText(TEST_TEXT)
      const navSpy = jest.spyOn(router, 'navigate')

      await userEvent.click(a)

      expect(a.getAttribute('target')).toBeDefined()
      expect(navSpy).not.toHaveBeenCalled()
  })

  it('should spread other props to its link', () => {
      router.start()
      const onMouseLeave = jest.fn()
      render(
          <RouterProvider router={router}>
              <ConnectedLink
                  routeName={'home'}
                  title="Hello"
                  data-testid="Link"
                  onMouseLeave={onMouseLeave}
              >
                {TEST_TEXT}
              </ConnectedLink>
          </RouterProvider>
      )

      const a = screen.queryByText(TEST_TEXT)

      expect(a.getAttribute('title')).toBe('Hello')
      expect(a.getAttribute('data-testid')).toBe('Link')
      expect(a.getAttribute('onMouseLeave')).toBe(onMouseLeave)
      expect(a.getAttribute('href')).toBe('/home')
      expect(a.getAttribute('class')).toContain('active')
  })
})
