import { z } from 'zod'

const DateSchema = z.union([z.string(), z.date()]).refine((val) => {
  if (val === '') return true
  const d = new Date(val)
  return !isNaN(d.getTime())
}, { message: 'Date invalide' })

const PositiveMoneySchema = z.string().regex(/^\d+(\.\d+)?$/, 'Le montant doit être un nombre positif').refine((val) => {
  return parseFloat(val) > 0
}, { message: 'Le montant doit être strictement supérieur à 0' })

export const CreateFactureSchema = z.object({
  devisId: z.string().min(1, 'L ID du devis est obligatoire'),
  dateEcheance: DateSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateFactureInput = z.infer<typeof CreateFactureSchema>

export const ModePaiementEnum = z.enum(['especes', 'virement', 'cheque', 'versement_bancaire'])

export const CreateVersementSchema = z.object({
  montantDzd: PositiveMoneySchema,
  modePaiement: ModePaiementEnum.default('especes'),
  dateVersement: DateSchema.optional().nullable(),
  reference: z.string().optional().nullable(),
  recuPar: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export type CreateVersementInput = z.infer<typeof CreateVersementSchema>
