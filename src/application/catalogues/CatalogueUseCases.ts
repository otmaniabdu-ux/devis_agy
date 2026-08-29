import { db } from '@/lib/db'

export class HotelUseCases {
  static async list(ville?: string | null) {
    return db.catalogueHotel.findMany({
      where: ville ? { ville } : undefined,
      orderBy: [{ ville: 'asc' }, { nom: 'asc' }],
    })
  }

  static async getById(id: string) {
    const hotel = await db.catalogueHotel.findUnique({ where: { id } })
    if (!hotel) throw new Error('Introuvable')
    return hotel
  }

  static async create(body: any) {
    return db.catalogueHotel.create({
      data: {
        ville: body.ville,
        nom: body.nom,
        nomAr: body.nomAr ?? null,
        etoiles: body.etoiles ?? 4,
        distanceHaram: body.distanceHaram ?? null,
        prixSingleSar: String(body.prixSingleSar ?? '0'),
        prixDoubleSar: String(body.prixDoubleSar ?? '0'),
        prixTripleSar: String(body.prixTripleSar ?? '0'),
        prixQuadrupleSar: String(body.prixQuadrupleSar ?? '0'),
        devise: body.devise ?? 'SAR',
        actif: body.actif ?? true,
      },
    })
  }

  static async update(id: string, body: any) {
    return db.catalogueHotel.update({
      where: { id },
      data: {
        ville: body.ville,
        nom: body.nom,
        nomAr: body.nomAr,
        etoiles: body.etoiles,
        distanceHaram: body.distanceHaram,
        prixSingleSar: body.prixSingleSar !== undefined ? String(body.prixSingleSar) : undefined,
        prixDoubleSar: body.prixDoubleSar !== undefined ? String(body.prixDoubleSar) : undefined,
        prixTripleSar: body.prixTripleSar !== undefined ? String(body.prixTripleSar) : undefined,
        prixQuadrupleSar: body.prixQuadrupleSar !== undefined ? String(body.prixQuadrupleSar) : undefined,
        devise: body.devise,
        actif: body.actif,
      },
    })
  }

  static async delete(id: string) {
    await db.catalogueHotel.delete({ where: { id } })
    return true
  }
}

export class CompagnieUseCases {
  static async list() {
    return db.catalogueCompagnie.findMany({
      orderBy: { nom: 'asc' },
    })
  }

  static async getById(id: string) {
    const compagnie = await db.catalogueCompagnie.findUnique({ where: { id } })
    if (!compagnie) throw new Error('Introuvable')
    return compagnie
  }

  static async create(body: any) {
    return db.catalogueCompagnie.create({
      data: {
        nom: body.nom,
        codeIata: body.codeIata ?? null,
        actif: body.actif ?? true,
      },
    })
  }

  static async update(id: string, body: any) {
    return db.catalogueCompagnie.update({
      where: { id },
      data: {
        nom: body.nom,
        codeIata: body.codeIata,
        actif: body.actif,
      },
    })
  }

  static async delete(id: string) {
    await db.catalogueCompagnie.delete({ where: { id } })
    return true
  }
}
