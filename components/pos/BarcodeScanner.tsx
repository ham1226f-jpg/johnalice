'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Camera, X, Keyboard } from 'lucide-react'
import { toast } from 'sonner'

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBarcodeDetected: (barcode: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onBarcodeDetected }: BarcodeScannerProps) {
  const [manualEntry, setManualEntry] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if BarcodeDetector API is available
  const isBarcodeDetectorAvailable = typeof window !== 'undefined' && 'BarcodeDetector' in window

  useEffect(() => {
    if (open && !manualEntry) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open, manualEntry])

  const startCamera = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecureContext = window.isSecureContext
      if (!isSecureContext) {
        toast.error('Camera requires HTTPS or localhost. Please use manual entry.', { 
          duration: 6000,
          description: 'For camera access, use https:// or localhost'
        })
        setManualEntry(true)
        return
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not supported on this device. Use manual entry.')
        setManualEntry(true)
        return
      }

      // First check camera permissions
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName })
        
        if (permissionStatus.state === 'denied') {
          toast.error('Camera permission denied', {
            duration: 8000,
            description: 'Please enable camera access in your browser settings:\n1. Click the lock/info icon in the address bar\n2. Allow camera access\n3. Reload the page'
          })
          setManualEntry(true)
          return
        }
      } catch (permError) {
        // Permission API might not be available, continue anyway
        console.log('Permission API not available, attempting camera access')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        
        // Start scanning if BarcodeDetector is available
        if (isBarcodeDetectorAvailable) {
          startBarcodeDetection()
        }
        
        toast.success('Camera ready - position barcode in frame', { duration: 2000 })
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error)
      
      let errorMessage = 'Could not access camera'
      let description = ''
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied'
        description = 'To enable:\n1. Click the lock/info icon in address bar\n2. Allow camera access\n3. Reload the page and try again'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found'
        description = 'Please ensure your device has a camera connected'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera in use'
        description = 'Close other apps using the camera and try again'
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not met'
        description = 'Your camera may not support the required settings'
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error'
        description = 'Camera access requires HTTPS or localhost'
      } else {
        description = 'Please use manual entry instead'
      }
      
      toast.error(errorMessage, { 
        duration: 8000,
        description 
      })
      setManualEntry(true)
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const startBarcodeDetection = async () => {
    if (!videoRef.current || !isBarcodeDetectorAvailable) return

    try {
      // @ts-ignore - BarcodeDetector is not in TypeScript types yet
      const barcodeDetector = new BarcodeDetector({
        formats: [
          'ean_13',
          'ean_8',
          'upc_a',
          'upc_e',
          'code_128',
          'code_39',
          'code_93',
          'codabar',
          'itf',
          'qr_code'
        ]
      })

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current)
            
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue
              handleBarcodeDetected(barcode)
            }
          } catch (error) {
            console.error('Error detecting barcode:', error)
          }
        }
      }, 300) // Scan every 300ms
    } catch (error) {
      console.error('Error initializing barcode detector:', error)
      toast.error('Barcode detection not supported. Use manual entry.')
      setManualEntry(true)
    }
  }

  const handleBarcodeDetected = (barcode: string) => {
    // Don't stop camera - keep it running for next scan
    onBarcodeDetected(barcode)
    toast.success(`Barcode scanned: ${barcode}`, { duration: 1500 })
    
    // Brief pause before allowing next scan (prevents duplicate scans)
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      setTimeout(() => {
        if (videoRef.current && isBarcodeDetectorAvailable && !manualEntry) {
          startBarcodeDetection()
        }
      }, 1000) // 1 second pause between scans
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (barcodeInput.trim()) {
      const barcode = barcodeInput.trim()
      onBarcodeDetected(barcode)
      toast.success(`Barcode entered: ${barcode}`, { duration: 1500 })
      setBarcodeInput('') // Clear input for next scan
      // Keep dialog open for continuous scanning
    }
  }

  const toggleInputMode = () => {
    setManualEntry(!manualEntry)
    setBarcodeInput('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Scan Barcode</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleInputMode}
                className="h-8 w-8 p-0"
                title={manualEntry ? "Switch to camera" : "Switch to manual entry"}
              >
                {manualEntry ? <Camera className="h-4 w-4" /> : <Keyboard className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                title="Close scanner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {manualEntry ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter Barcode Manually
                </label>
                <Input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Enter barcode number"
                  autoFocus
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Camera scanning requires HTTPS and camera permissions
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={!barcodeInput.trim()}>
                Add to Cart
              </Button>
              <p className="text-xs text-center text-primary">
                Scanner stays open for continuous scanning
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary w-3/4 h-1/2 rounded-lg">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary animate-pulse" />
                    </div>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                    <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>Scanning...</span>
                    </div>
                  </div>
                )}
              </div>
              
              {!isBarcodeDetectorAvailable && (
                <div className="text-sm text-muted-foreground text-center p-3 bg-muted rounded-md">
                  Automatic scanning not supported on this browser.
                  <br />
                  Please use manual entry or try Chrome/Edge.
                </div>
              )}

              <div className="text-sm text-muted-foreground text-center space-y-1">
                <p>Position the barcode within the frame</p>
                <p className="text-xs">
                  💡 Tip: Products will be added automatically after scanning
                </p>
                <p className="text-xs text-primary">
                  Scanner stays open for continuous scanning
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
