'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from './button'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  setMonth,
  setYear,
  getYear,
  getMonth,
} from 'date-fns'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date) => void
  placeholder?: string
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const YEARS = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i)

export function DatePicker({ value, onChange, placeholder = 'Pick a date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value || new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateSelect = (date: Date) => {
    onChange(date)
    setIsOpen(false)
  }

  const handleMonthChange = (monthIndex: number) => {
    setCurrentMonth(setMonth(currentMonth, monthIndex))
  }

  const handleYearChange = (year: number) => {
    setCurrentMonth(setYear(currentMonth, year))
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isSelected = value && isSameDay(day, value)
        const isToday = isSameDay(day, new Date())

        days.push(
          <button
            key={day.toString()}
            onClick={() => handleDateSelect(cloneDay)}
            className={`w-8 h-8 text-sm rounded-md transition-colors ${
              !isCurrentMonth
                ? 'text-muted-foreground/40'
                : isSelected
                ? 'bg-primary text-primary-foreground'
                : isToday
                ? 'bg-accent text-accent-foreground font-semibold'
                : 'hover:bg-accent'
            }`}
          >
            {format(day, 'd')}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-1">
          {days}
        </div>
      )
      days = []
    }

    return rows
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors w-[160px] justify-between"
      >
        <span className={value ? '' : 'text-muted-foreground'}>
          {value ? format(value, 'MMM dd, yyyy') : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[280px]">
          {/* Month/Year Selectors */}
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              <select
                value={getMonth(currentMonth)}
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="h-8 px-2 rounded-md border border-input bg-background text-sm"
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              
              <select
                value={getYear(currentMonth)}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="h-8 px-2 rounded-md border border-input bg-background text-sm"
              >
                {YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">
            {renderCalendar()}
          </div>

          {/* Today Button */}
          <div className="mt-3 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const today = new Date()
                setCurrentMonth(today)
                handleDateSelect(today)
              }}
            >
              Today
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
