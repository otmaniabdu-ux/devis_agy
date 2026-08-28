import 'dotenv/config'
import { db } from '../src/lib/db'
import { bookingHotels } from '../src/lib/data/booking-hotels'
import { compagniesAeriennes } from '../src/lib/data/airlines'

async function populateCatalogues() {
  console.log(`🏨 Début de la mise à jour des catalogues...`)

  // 1. Mettre à jour les compagnies aériennes
  console.log(`✈️ Mise à jour des compagnies aériennes (${compagniesAeriennes.length} compagnies)...`)
  for (const c of compagniesAeriennes) {
    const existing = await db.catalogueCompagnie.findFirst({
      where: {
        OR: [
          { nom: c.nom },
          ...(c.codeIata ? [{ codeIata: c.codeIata }] : []),
        ],
      },
    })
    if (existing) {
      await db.catalogueCompagnie.update({
        where: { id: existing.id },
        data: { nom: c.nom, codeIata: c.codeIata, actif: c.actif },
      })
    } else {
      await db.catalogueCompagnie.create({
        data: c,
      })
    }
  }
  const totalCompagnies = await db.catalogueCompagnie.count()
  console.log(`✅ ${totalCompagnies} compagnies aériennes actives dans la base.`)

  // 2. Mettre à jour les hôtels
  console.log(`🏨 Mise à jour des hôtels (${bookingHotels.length} hôtels Makkah & Médine)...`)
  for (const h of bookingHotels) {
    const existing = await db.catalogueHotel.findFirst({
      where: {
        nom: h.nom,
        ville: h.ville,
      },
    })

    if (existing) {
      await db.catalogueHotel.update({
        where: { id: existing.id },
        data: h,
      })
    } else {
      await db.catalogueHotel.create({
        data: h,
      })
    }
  }

  const totalMakkah = await db.catalogueHotel.count({ where: { ville: 'Makkah' } })
  const totalMedine = await db.catalogueHotel.count({ where: { ville: 'Medine' } })
  console.log(`- Total Hôtels Makkah : ${totalMakkah}`)
  console.log(`- Total Hôtels Médine : ${totalMedine}`)
  console.log(`- Total Général Hôtels : ${totalMakkah + totalMedine}`)
  console.log(`🎉 Catalogues enrichis avec succès !`)
}

populateCatalogues()
  .then(async () => {
    await db.$disconnect()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('❌ Erreur:', err)
    await db.$disconnect()
    process.exit(1)
  })
