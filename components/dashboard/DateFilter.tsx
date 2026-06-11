'use client'

import { Calendar } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isValid } from 'date-fns'

export type DateFilterOption = 
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom'

interface DateRange {
  startDate?: Date
  endDate?: Date
}

export function getDateRange(option: DateFilterOption, customDate?: Date): DateRange {
  const now = new Date()
  
  switch (option) {
    case 'all':
      return { startDate: undefined, endDate: undefined }
    case 'today':
      return { startDate: startOfDay(now), endDate: endOfDay(now) }
    case 'yesterday':
      const yesterday = subDays(now, 1)
      return { startDate: startOfDay(yesterday), endDate: endOfDay(yesterday) }
    case 'last7days':
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) }
    case 'last30days':
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) }
    case 'thisWeek':
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'lastWeek':
      const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 })
      const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 })
      return { startDate: lastWeekStart, endDate: lastWeekEnd }
    case 'thisMonth':
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) }
    case 'lastMonth':
      const lastMonth = subMonths(now, 1)
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) }
    case 'custom':
      if (customDate && isValid(customDate)) {
        return { startDate: startOfDay(customDate), endDate: endOfDay(customDate) }
      }
      return { startDate: startOfDay(now), endDate: endOfDay(now) }
    default:
      return { startDate: undefined, endDate: undefined }
  }
}

const filterOptions: { value: DateFilterOption; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'custom', label: 'Custom Date' },
]

interface DateFilterProps {
  value: DateFilterOption
  onChange: (value: DateFilterOption) => void
  customDate?: Date
  onCustomDateChange?: (date: Date) => void
  restrictToToday?: boolean
}

export function DateFilter({ value, onChange, customDate, onCustomDateChange, restrictToToday }: DateFilterProps) {
  const options = restrictToToday
    ? filterOptions.filter(o => o.value === 'today' || o.value === 'custom')
    : filterOptions
  const handleCustomDateSelect = (date: Date) => {
    if (onCustomDateChange) {
      onCustomDateChange(date)
    }
    // Auto-switch to custom when a date is picked
    if (value !== 'custom') {
      onChange('custom')
    }
  }

  return (
    <div className="flex items-center gap-2" data-tour="date-filter">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as DateFilterOption)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePicker
        value={value === 'custom' ? customDate : undefined}
        onChange={handleCustomDateSelect}
        placeholder="Pick date"
      />
    </div>
  )
}
