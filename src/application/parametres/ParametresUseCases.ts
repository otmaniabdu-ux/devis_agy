import { db } from '@/lib/db'

export interface ParametresInput {
  nomFr?: string
  nomAr?: string
  sloganFr?: string
  sloganAr?: string
  adresse?: string
  telephone?: string
  email?: string
  rc?: string
  if?: string
  art?: string
  capital?: string
}

export interface TauxInput {
  code: string
  libelleFr: string
  libelleAr: string
  tauxDzd: string | number
}

export interface UpdateParametresInput {
  parametres?: ParametresInput
  taux?: TauxInput[]
}

export class ParametresUseCases {
  static async get() {
    const parametres = await db.parametresAgence.findUnique({ where: { id: 'default' } })
    const taux = await db.tauxChange.findMany()
    return { parametres, taux }
  }

  static async update(body: UpdateParametresInput) {
    if (body.parametres) {
      const p = body.parametres
      await db.parametresAgence.upsert({
        where: { id: 'default' },
        update: {
          nomFr: p.nomFr,
          nomAr: p.nomAr,
          sloganFr: p.sloganFr ?? null,
          sloganAr: p.sloganAr ?? null,
          adresse: p.adresse ?? null,
          telephone: p.telephone ?? null,
          email: p.email ?? null,
          rc: p.rc ?? null,
          if: p.if ?? null,
          art: p.art ?? null,
          capital: p.capital ?? null,
        },
        create: {
          id: 'default',
          nomFr: p.nomFr ?? 'El Mouhssinoune Tours',
          nomAr: p.nomAr ?? 'المحسنون للسياحة',
          sloganFr: p.sloganFr ?? null,
          sloganAr: p.sloganAr ?? null,
          adresse: p.adresse ?? null,
          telephone: p.telephone ?? null,
          email: p.email ?? null,
          rc: p.rc ?? null,
          if: p.if ?? null,
          art: p.art ?? null,
          capital: p.capital ?? null,
        },
      })
    }
    
    if (body.taux) {
      for (const t of body.taux) {
        await db.tauxChange.upsert({
          where: { code: t.code },
          update: { tauxDzd: String(t.tauxDzd) },
          create: {
            code: t.code,
            libelleFr: t.libelleFr,
            libelleAr: t.libelleAr,
            tauxDzd: String(t.tauxDzd),
          },
        })
      }
    }
    return true
  }
}
