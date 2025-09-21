import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST() {
  try {
    const admin = createAdminClient()

    // Mark listings as expired if past payment_expires_at and currently paid
    const nowIso = new Date().toISOString()

    const { data: expiredUpdated, error: expireError } = await admin
      .from('listings')
      .update({
        payment_status: 'expired',
        active: false,
        updated_at: nowIso,
      })
      .lt('payment_expires_at', nowIso)
      .eq('payment_status', 'paid')
      .select('id')

    if (expireError) {
      console.error('Error expiring listings:', expireError)
      return NextResponse.json({ error: 'Failed to expire listings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, expiredCount: expiredUpdated?.length || 0 })
  } catch (error) {
    console.error('check-expired error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


