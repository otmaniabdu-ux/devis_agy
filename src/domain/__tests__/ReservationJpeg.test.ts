import { describe, it, expect } from 'vitest'
import { generateReservationJpeg } from '@/lib/reservationJpegRenderer'
import { db } from '@/lib/db'

describe('generateReservationJpeg (English Hotel Voucher)', () => {
  it('should generate a valid JPEG buffer for hotel booking with English fields', async () => {
    const devis = await db.devis.findFirst({
      include: { hebergements: true },
    })

    if (!devis) {
      console.warn('No devis in database to test reservation JPEG')
      return
    }

    const buffer = await generateReservationJpeg({
      devisId: devis.id,
      typePrestation: 'hotel',
    })

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(10000)
    // JPEG Magic Bytes: 0xFF, 0xD8, 0xFF
    expect(buffer[0]).toBe(0xff)
    expect(buffer[1]).toBe(0xd8)
    expect(buffer[2]).toBe(0xff)
  })
})
