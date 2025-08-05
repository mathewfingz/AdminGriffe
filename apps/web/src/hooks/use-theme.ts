'use client'

import { useEffect, useState } from 'react'

export type ThemeName = 'pixel-verse' | 'curry-landing' | 'nova-haven' | 'nova-works'

export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>('nova-haven')

  useEffect(() => {
    // Get theme from localStorage or default to nova-haven
    const savedTheme = localStorage.getItem('admin-griffe-theme') as ThemeName
    if (savedTheme && ['pixel-verse', 'curry-landing', 'nova-haven', 'nova-works'].includes(savedTheme)) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('admin-griffe-theme', theme)
  }, [theme])

  return {
    theme,
    setTheme,
    themes: ['pixel-verse', 'curry-landing', 'nova-haven', 'nova-works'] as const,
  }
}