'use client'

import { Moon, Sun, Palette } from 'lucide-react'
import { useTheme, colorThemes } from '@/contexts/ThemeContext'
import { useState, useRef, useEffect } from 'react'

export function ThemeToggle() {
  const { mode, toggleMode, colorTheme, setColorTheme } = useTheme()
  const [showPalette, setShowPalette] = useState(false)
  const paletteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
        setShowPalette(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center gap-1 sm:gap-2" ref={paletteRef}>
      <button
        onClick={toggleMode}
        className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
        aria-label="Toggle dark mode"
      >
        {mode === 'light' ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
          aria-label="Change color theme"
        >
          <Palette className="h-4 w-4" />
        </button>
        
        {showPalette && (
          <div className="absolute right-0 top-full mt-2 p-3 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[180px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Color Theme</p>
            <div className="grid grid-cols-4 gap-2">
              {colorThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => {
                    setColorTheme(theme.value)
                    setShowPalette(false)
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    colorTheme === theme.value 
                      ? 'border-foreground ring-2 ring-offset-2 ring-offset-background ring-primary' 
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: theme.preview }}
                  title={theme.label}
                  aria-label={`${theme.label} theme`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
