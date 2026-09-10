import { NextRequest, NextResponse } from 'next/server'
import { generateReservationJpeg } from '@/lib/reservationJpegRenderer'
import { getErrorMessage } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { devisId, typePrestation = 'hotel', targetId } = body

    if (!devisId) {
      return NextResponse.json({ error: 'devisId manquant' }, { status: 400 })
    }

    const jpegBuffer = await generateReservationJpeg({
      devisId,
      typePrestation,
      targetId,
    })

    const filename = `Reservation-${typePrestation.toUpperCase()}-${devisId.slice(0, 8)}.jpeg`

    return new NextResponse(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const msg = getErrorMessage(error)
    console.error('Erreur génération JPEG réservation:', error)
    return NextResponse.json({ error: msg || 'Erreur lors de la génération du JPEG' }, { status: 500 })
  }
}
