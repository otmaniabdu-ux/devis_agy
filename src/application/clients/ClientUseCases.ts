import { db } from '@/lib/db'
import { z } from 'zod'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validation/clientSchemas'

export class ClientUseCases {
  static async list() {
    return db.client.findMany({
      include: { _count: { select: { devis: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async getById(id: string) {
    const client = await db.client.findUnique({
      where: { id },
      include: { devis: { orderBy: { createdAt: 'desc' } } },
    })
    if (!client) throw new Error('Client introuvable')
    return client
  }

  static async create(data: z.infer<typeof CreateClientSchema>) {
    return db.client.create({
      data: {
        type: data.type,
        nom: data.nom,
        prenom: data.prenom ?? null,
        raisonSociale: data.raisonSociale ?? null,
        telephone: data.telephone ?? null,
        email: data.email ?? null,
        adresse: data.adresse ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  static async update(id: string, data: z.infer<typeof UpdateClientSchema>) {
    return db.client.update({
      where: { id },
      data: {
        type: data.type,
        nom: data.nom,
        prenom: data.prenom ?? null,
        raisonSociale: data.raisonSociale ?? null,
        telephone: data.telephone ?? null,
        email: data.email ?? null,
        adresse: data.adresse ?? null,
        notes: data.notes ?? null,
      },
    })
  }

  static async delete(id: string) {
    await db.client.delete({ where: { id } })
    return true
  }
}
