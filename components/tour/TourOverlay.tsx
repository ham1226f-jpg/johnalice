'use client'

import { useEffect, useState } from 'react'
import { TourOverlayProps } from '@/types'

export function TourOverlay({ targetElement, isActive, onClickOutside }: TourOverlayProps) {
  const [elementRect, setElementRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!isActive || !targetElement) {
      setElementRect(null)
      return
    }

    const updateRect = () => {
      const rect = targetElement.getBoundingClientRect()
      setElementRect(rect)
    }

    // Initial update
    updateRect()

    // Update on scroll and resize with throttling for performance
    let rafId: number | null = null
    const throttledUpdate = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        updateRect()
        rafId = null
      })
    }

    window.addEventListener('scroll', throttledUpdate, true)
    window.addEventListener('resize', throttledUpdate)

    return () => {
      window.removeEventListener('scroll', throttledUpdate, true)
      window.removeEventListener('resize', throttledUpdate)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [targetElement, isActive])

  if (!isActive) return null

  const padding = 8 // Padding around the highlighted element

  return (
    <>
      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-[9998] transition-opacity duration-300 animate-in fade-in"
        onClick={onClickOutside}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Spotlight cutout with precise positioning */}
      {elementRect && (
        <>
          {/* Main spotlight */}
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: elementRect.top - padding,
              left: elementRect.left - padding,
              width: elementRect.width + padding * 2,
              height: elementRect.height + padding * 2,
              boxShadow: `0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6)`,
              borderRadius: '8px',
              transition: 'all 0.3s ease-in-out',
              animation: 'spotlight-pulse 2s ease-in-out infinite'
            }}
          />
          
          {/* Precise position indicator - small dot at center */}
          <div
            className="fixed z-[10000] pointer-events-none"
            style={{
              top: elementRect.top + elementRect.height / 2 - 3,
              left: elementRect.left + elementRect.width / 2 - 3,
              width: 6,
              height: 6,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderRadius: '50%',
              animation: 'pulse-dot 1.5s ease-in-out infinite'
            }}
          />
          
          {/* Corner markers for precise positioning */}
          {[
            { top: elementRect.top - padding, left: elementRect.left - padding },
            { top: elementRect.top - padding, left: elementRect.right + padding - 12 },
            { top: elementRect.bottom + padding - 12, left: elementRect.left - padding },
            { top: elementRect.bottom + padding - 12, left: elementRect.right + padding - 12 }
          ].map((pos, i) => (
            <div
              key={i}
              className="fixed z-[10000] pointer-events-none"
              style={{
                top: pos.top,
                left: pos.left,
                width: 12,
                height: 12,
                border: '2px solid rgba(59, 130, 246, 0.6)',
                borderRadius: '2px'
              }}
            />
          ))}
        </>
      )}

      <style jsx>{`
        @keyframes spotlight-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.6);
          }
        }
        
        @keyframes pulse-dot {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  )
}
