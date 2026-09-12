import { db } from '@/lib/db'
import { z } from 'zod'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validation/clientSchemas'
import { AuditUseCases } from '@/application/audit/AuditUseCases'

export class ClientUseCases {
  static async list() {
    // Projection minimale : la liste n'expose que les champs affichés
    // (adresse et notes réservés au endpoint de détail GET /api/clients/[id]).
    return db.client.findMany({
      select: {
        id: true,
        type: true,
        nom: true,
        prenom: true,
        raisonSociale: true,
        telephone: true,
        email: true,
        createdAt: true,
        _count: { select: { devis: true } },
      },
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
    const client = await db.client.create({
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
    await AuditUseCases.log('CREATE_CLIENT', 'Client', client.id)
    return client
  }

  static async update(id: string, data: z.infer<typeof UpdateClientSchema>) {
    const client = await db.client.update({
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
    await AuditUseCases.log('UPDATE_CLIENT', 'Client', client.id)
    return client
  }

  static async delete(id: string) {
    await db.client.delete({ where: { id } })
    await AuditUseCases.log('DELETE_CLIENT', 'Client', id)
    return true
  }
}
