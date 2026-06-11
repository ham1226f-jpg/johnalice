'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, FileText, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { toast } from 'sonner'
import { getReceiptSettings, saveReceiptSettings, ReceiptSettings as ReceiptSettingsType } from '@/lib/services/receipt-settings'

export function ReceiptSettings() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<ReceiptSettingsType>({
    business_name: '',
    phone: '',
    email: '',
    address: '',
    additional_info: '',
    footer_text: 'Thank you for your business!'
  })

  useEffect(() => {
    loadSettings()
  }, [tenant?.id, currentStore?.id])

  const loadSettings = async () => {
    if (!tenant?.id || !currentStore?.id) return

    setLoading(true)
    try {
      const data = await getReceiptSettings(tenant.id, currentStore.id)
      if (data) {
        setSettings(data)
      }
    } catch (error: any) {
      console.error('Load settings error:', error)
      toast.error('Failed to load receipt settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!tenant?.id || !currentStore?.id) {
      toast.error('Store information not available')
      return
    }

    setSaving(true)
    try {
      await saveReceiptSettings(tenant.id, currentStore.id, settings)
      toast.success('Receipt settings saved successfully')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save receipt settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Receipt Customization
          </CardTitle>
          <CardDescription>
            Customize your receipt with business information and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={settings.business_name}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              placeholder="Enter your business name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="+254 700 000 000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="business@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Enter your business address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_info">Additional Information</Label>
            <Textarea
              id="additional_info"
              value={settings.additional_info}
              onChange={(e) => setSettings({ ...settings, additional_info: e.target.value })}
              placeholder="Tax ID, business registration, or other details"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer_text">Footer Text</Label>
            <Input
              id="footer_text"
              value={settings.footer_text}
              onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
              placeholder="Thank you message or tagline"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving || !settings.business_name}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipt Preview</CardTitle>
          <CardDescription>
            This is how your receipt will appear
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white text-black font-mono text-sm space-y-3 max-w-xs mx-auto">
            <div className="text-center border-b pb-3">
              <div className="font-bold text-lg">{settings.business_name || '[Business Name]'}</div>
              {settings.address && <div className="text-xs mt-1">{settings.address}</div>}
              {settings.phone && <div className="text-xs mt-1">{settings.phone}</div>}
              {settings.email && <div className="text-xs">{settings.email}</div>}
              {settings.additional_info && (
                <div className="text-xs mt-1 whitespace-pre-line">{settings.additional_info}</div>
              )}
            </div>

            <div className="text-xs border-b pb-2">
              <div>Receipt #: SALE-237160</div>
              <div>Date: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString('en-GB', { hour12: false })}</div>
              <div>Served by: John Smart Traders</div>
              <div>Payment: CASH</div>
            </div>

            <div className="space-y-1">
              <div className="flex text-xs font-bold">
                <span className="flex-1">ITEM DETAILS</span>
                <span className="w-12 text-center">QTY</span>
                <span className="w-20 text-right">TOTAL</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div>
                  <div className="flex">
                    <span className="flex-1">200 A4 pages</span>
                    <span className="w-12 text-center">16</span>
                    <span className="w-20 text-right">KSH 1133</span>
                  </div>
                  <div className="text-xs text-gray-600">Unit: KSH 71</div>
                </div>
                
                <div>
                  <div className="flex">
                    <span className="flex-1">pencils</span>
                    <span className="w-12 text-center">1</span>
                    <span className="w-20 text-right">KSH 70</span>
                  </div>
                  <div className="text-xs text-gray-600">Unit: KSH 70</div>
                </div>
                
                <div>
                  <div className="flex">
                    <span className="flex-1">Blue Obama pen</span>
                    <span className="w-12 text-center">50</span>
                    <span className="w-20 text-right">KSH 200</span>
                  </div>
                  <div className="text-xs text-gray-600">Unit: KSH 4</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>KSH 1403</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span>KSH 1403</span>
              </div>
            </div>

            <div className="text-center text-xs border-t pt-3">
              <div className="whitespace-pre-line">{settings.footer_text || 'Thank you for your business!'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
