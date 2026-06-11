/**
 * Export data to CSV format
 * @param data - 2D array of data to export
 * @param filename - Name of the file (without extension)
 */
export function exportToCSV(data: any[][], filename: string): void {
  // Convert data to CSV format
  const csvContent = data
    .map(row => 
      row.map(cell => {
        // Handle cells that contain commas, quotes, or newlines
        const cellStr = String(cell ?? '')
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
    .join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Export data to Excel-compatible CSV format with UTF-8 BOM
 * This ensures proper character encoding in Excel
 */
export function exportToExcelCSV(data: any[][], filename: string): void {
  const csvContent = data
    .map(row => 
      row.map(cell => {
        const cellStr = String(cell ?? '')
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
    .join('\n')

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
