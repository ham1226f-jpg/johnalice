'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Camera, Info } from 'lucide-react'

export function CameraPermissionsHelp() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Camera Access Required</AlertTitle>
      <AlertDescription className="space-y-2 text-xs">
        <p>To enable camera for barcode scanning:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Click the lock icon (🔒) in your address bar</li>
          <li>Find "Camera" and set to "Allow"</li>
          <li>Reload this page</li>
          <li>Click "Scan" button again</li>
        </ol>
        <p className="text-muted-foreground mt-2">
          Note: Camera requires HTTPS or localhost
        </p>
      </AlertDescription>
    </Alert>
  )
}
