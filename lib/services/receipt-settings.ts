import { createClient } from '@/lib/supabase/client'

export interface ReceiptSettings {
  business_name: string
  phone: string
  email: string
  address: string
  additional_info: string
  footer_text: string
}

export async function getReceiptSettings(
  tenantId: string,
  storeId: string
): Promise<ReceiptSettings | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('receipt_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching receipt settings:', error)
    throw error
  }

  if (!data) {
    // No settings found, return default
    return {
      business_name: '',
      phone: '',
      email: '',
      address: '',
      additional_info: '',
      footer_text: 'Thank you for your business!'
    }
  }

  return {
    business_name: data.business_name || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    additional_info: data.additional_info || '',
    footer_text: data.footer_text || 'Thank you for your business!'
  }
}

export async function saveReceiptSettings(
  tenantId: string,
  storeId: string,
  settings: ReceiptSettings
): Promise<void> {
  const supabase = createClient()

  // Check if settings exist
  const { data: existing } = await (supabase as any)
    .from('receipt_settings')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .maybeSingle()

  if (existing) {
    // Update existing
    const { error } = await (supabase as any)
      .from('receipt_settings')
      .update({
        business_name: settings.business_name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        additional_info: settings.additional_info,
        footer_text: settings.footer_text,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)

    if (error) throw error
  } else {
    // Insert new
    const { error } = await (supabase as any)
      .from('receipt_settings')
      .insert({
        tenant_id: tenantId,
        store_id: storeId,
        business_name: settings.business_name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        additional_info: settings.additional_info,
        footer_text: settings.footer_text
      })

    if (error) throw error
  }
}
