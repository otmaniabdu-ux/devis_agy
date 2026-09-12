import { NextRequest, NextResponse } from 'next/server'
import { requireAgent } from '@/lib/api-auth'
import { z } from 'zod'
import { generateReservationJpeg } from '@/lib/reservationJpegRenderer'
import { getErrorMessage } from '@/lib/errors'

const ExportJpegSchema = z.object({
  devisId: z.string().min(1, 'devisId manquant'),
  typePrestation: z.enum(['hotel', 'vol', 'transport', 'global']).default('hotel'),
  targetId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const agent = await requireAgent(req)
  if (agent instanceof NextResponse) return agent

  try {
    const body = await req.json()
    const parsed = ExportJpegSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const { devisId, typePrestation, targetId } = parsed.data

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
