export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    throw new Error('No data to export')
  }

  // Get headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        
        // Handle null/undefined
        if (value === null || value === undefined) return ''
        
        // Handle dates
        if (value instanceof Date) {
          return formatDateForCSV(value)
        }
        
        // Handle strings with special characters
        if (typeof value === 'string') {
          return escapeCSVValue(value)
        }
        
        return value
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function escapeCSVValue(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function formatDateForCSV(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

export function formatDateTimeForCSV(dateString: string): string {
  const date = new Date(dateString)
  return date.toISOString().replace('T', ' ').substring(0, 19)
}
