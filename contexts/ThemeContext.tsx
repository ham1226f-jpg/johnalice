'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Mode = 'light' | 'dark'
type ColorTheme = 'zinc' | 'slate' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'violet'

interface ThemeContextType {
  mode: Mode
  colorTheme: ColorTheme
  toggleMode: () => void
  setMode: (mode: Mode) => void
  setColorTheme: (theme: ColorTheme) => void
  // Legacy support
  theme: Mode
  toggleTheme: () => void
  setTheme: (theme: Mode) => void
}

export const colorThemes: { value: ColorTheme; label: string; preview: string }[] = [
  { value: 'zinc', label: 'Zinc', preview: '#71717a' },
  { value: 'slate', label: 'Slate', preview: '#64748b' },
  { value: 'ocean', label: 'Ocean', preview: '#0ea5e9' },
  { value: 'forest', label: 'Forest', preview: '#22c55e' },
  { value: 'sunset', label: 'Sunset', preview: '#f97316' },
  { value: 'rose', label: 'Rose', preview: '#f43f5e' },
  { value: 'violet', label: 'Violet', preview: '#8b5cf6' },
]

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light')
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('zinc')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Get mode from localStorage or system preference
    const storedMode = localStorage.getItem('theme-mode') as Mode | null
    const storedColor = localStorage.getItem('color-theme') as ColorTheme | null
    
    if (storedMode) {
      setModeState(storedMode)
      document.documentElement.classList.toggle('dark', storedMode === 'dark')
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initialMode = prefersDark ? 'dark' : 'light'
      setModeState(initialMode)
      document.documentElement.classList.toggle('dark', prefersDark)
    }
    
    if (storedColor) {
      setColorThemeState(storedColor)
      document.documentElement.setAttribute('data-theme', storedColor)
    } else {
      document.documentElement.setAttribute('data-theme', 'zinc')
    }
  }, [])

  const setMode = (newMode: Mode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
    document.documentElement.classList.toggle('dark', newMode === 'dark')
  }

  const toggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light')
  }

  const setColorTheme = (newTheme: ColorTheme) => {
    setColorThemeState(newTheme)
    localStorage.setItem('color-theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ 
      mode, 
      colorTheme, 
      toggleMode, 
      setMode, 
      setColorTheme,
      // Legacy support
      theme: mode,
      toggleTheme: toggleMode,
      setTheme: setMode,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
