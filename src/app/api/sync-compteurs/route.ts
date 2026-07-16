// Synchronise les compteurs de numérotation avec les devis réellement existants.
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const allDevis = await db.devis.findMany({ select: { numero: true } })

    const parCle: Record<string, number> = {}
    for (const d of allDevis) {
      const match = d.numero.match(/^DEVIS-(\d{4})-(\d{2})-(\d+)$/)
      if (match) {
        const cle = `DEVIS-${match[1]}-${match[2]}`
        const num = parseInt(match[3], 10)
        if (!parCle[cle] || parCle[cle] < num) {
          parCle[cle] = num
        }
      }
    }

    const result: Record<string, number> = {}
    for (const [cle, maxNum] of Object.entries(parCle)) {
      await db.compteurNumerotation.upsert({
        where: { cle },
        update: { dernierNumero: maxNum },
        create: { cle, dernierNumero: maxNum },
      })
      result[cle] = maxNum
    }

    // Nettoie les compteurs orphelins
    const allCompteurs = await db.compteurNumerotation.findMany()
    for (const c of allCompteurs) {
      if (!parCle[c.cle]) {
        await db.compteurNumerotation.delete({ where: { cle: c.cle } })
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Compteurs synchronisés',
      compteurs: result,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
