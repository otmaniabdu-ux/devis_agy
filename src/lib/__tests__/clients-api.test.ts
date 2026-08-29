import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/clients/route'
import { db } from '@/lib/db'

// Mocker Prisma
vi.mock('@/lib/db', () => ({
  db: {
    client: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

describe('POST /api/clients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('crée un client valide (particulier)', async () => {
    const payload = {
      type: 'particulier',
      nom: 'Dupont',
      prenom: 'Jean',
    }

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    // Mock le retour Prisma
    vi.mocked(db.client.create).mockResolvedValueOnce({
      id: '123',
      ...payload,
      raisonSociale: null,
      telephone: null,
      email: null,
      adresse: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.id).toBe('123')
    expect(db.client.create).toHaveBeenCalledTimes(1)
  })

  it('rejette un particulier sans prénom', async () => {
    const payload = {
      type: 'particulier',
      nom: 'Dupont',
      // prénom manquant
    }

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('Données invalides')
    expect(json.details.prenom).toBeDefined()
    expect(db.client.create).not.toHaveBeenCalled()
  })

  it('accepte une société sans prénom mais avec nom', async () => {
    const payload = {
      type: 'societe',
      nom: 'Acme Corp', // Le nom est requis par le schéma de base
      raisonSociale: 'Acme Corporation',
    }

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    vi.mocked(db.client.create).mockResolvedValueOnce({ id: '124', ...payload } as any)

    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('rejette un payload avec un nom trop court', async () => {
    const payload = {
      type: 'particulier',
      nom: 'A', // Trop court
      prenom: 'Jean',
    }

    const req = new NextRequest('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
