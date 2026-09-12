import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocker Prisma (vi.hoisted : les factories vi.mock sont hissées au-dessus des déclarations)
const { txMock, dbMock } = vi.hoisted(() => {
  const txMock = {
    devis: {
      create: vi.fn().mockResolvedValue({ id: 'devis-1' }),
    },
  }
  const dbMock = {
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<string>) => fn(txMock)),
    devis: {
      // Utilisé par DevisUseCases.getById (appelé à la fin de create)
      findUnique: vi.fn().mockResolvedValue({ id: 'devis-1', dateRetour: null, passagers: [] }),
    },
  }
  return { txMock, dbMock }
})

vi.mock('@/lib/db', () => ({ db: dbMock }))

// Mocker les dépendances de DevisUseCases.create
vi.mock('@/lib/devisPayload', () => ({
  buildDevisCreateData: vi.fn().mockResolvedValue({ numero: 'DEVIS-2026-09-001' }),
}))

vi.mock('@/application/RecalculerDevisUseCase', () => ({
  RecalculerDevisUseCase: {
    execute: vi.fn(),
  },
}))

vi.mock('@/application/audit/AuditUseCases', () => ({
  AuditUseCases: {
    log: vi.fn(),
  },
}))

import { DevisUseCases } from '@/application/devis/DevisUseCases'
import { RecalculerDevisUseCase } from '@/application/RecalculerDevisUseCase'
import { AuditUseCases } from '@/application/audit/AuditUseCases'

describe('DevisUseCases.create — atomicité', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    txMock.devis.create.mockResolvedValue({ id: 'devis-1' })
  })

  it('passe le contexte transactionnel (tx) au recalcul, pas db', async () => {
    await DevisUseCases.create({} as never)

    expect(txMock.devis.create).toHaveBeenCalledTimes(1)
    expect(RecalculerDevisUseCase.execute).toHaveBeenCalledWith('devis-1', txMock)
    expect(AuditUseCases.log).toHaveBeenCalledWith('CREATE_DEVIS', 'Devis', 'devis-1')
  })

  it('rollback complet : si le recalcul échoue, aucun devis orphelin n\u2019est persisté', async () => {
    vi.mocked(RecalculerDevisUseCase.execute).mockRejectedValueOnce(new Error('Erreur de calcul'))

    await expect(DevisUseCases.create({} as never)).rejects.toThrow('Erreur de calcul')

    // Le create et le recalcul ont bien été tentés dans la même transaction
    expect(txMock.devis.create).toHaveBeenCalledTimes(1)
    // L'audit n'est jamais journalisé : la transaction a échoué
    expect(AuditUseCases.log).not.toHaveBeenCalled()
  })
})
