import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'Didit API routes are working!',
    timestamp: new Date().toISOString()
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Didit API POST routes are working!',
    timestamp: new Date().toISOString()
  })
}
