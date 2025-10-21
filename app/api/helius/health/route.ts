import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const heliusKey = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    if (!heliusKey || heliusKey.trim() === '' || heliusKey.includes('YOUR_HELIUS_API_KEY')) {
      return NextResponse.json({ ok: false, message: 'Helius API key not configured on server' }, { status: 200 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, message: (err as Error).message || 'unknown' }, { status: 500 });
  }
}
