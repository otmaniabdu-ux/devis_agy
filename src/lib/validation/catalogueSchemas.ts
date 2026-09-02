import { z } from 'zod'

const PositiveMoneyStringSchema = z.union([
  z.string().regex(/^\d+(\.\d+)?$/, "Le montant ne peut pas être négatif"),
  z.number().min(0)
]).transform(String)

export const CreateHotelSchema = z.object({
  ville: z.string().min(1, "La ville est requise"),
  nom: z.string().min(1, "Le nom est requis"),
  nomAr: z.string().optional().nullable(),
  etoiles: z.number().int().min(1).max(5).optional().default(4),
  distanceHaram: z.number().int().optional().nullable(),
  prixSingleSar: PositiveMoneyStringSchema.optional().default('0'),
  prixDoubleSar: PositiveMoneyStringSchema.optional().default('0'),
  prixTripleSar: PositiveMoneyStringSchema.optional().default('0'),
  prixQuadrupleSar: PositiveMoneyStringSchema.optional().default('0'),
  devise: z.string().optional().default('SAR'),
  actif: z.boolean().optional().default(true),
})

export const UpdateHotelSchema = CreateHotelSchema.partial()

export const CreateCompagnieSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  codeIata: z.string().optional().nullable(),
  actif: z.boolean().optional().default(true),
})

export const UpdateCompagnieSchema = CreateCompagnieSchema.partial()

export type CreateHotelInput = z.infer<typeof CreateHotelSchema>
export type UpdateHotelInput = z.infer<typeof UpdateHotelSchema>
export type CreateCompagnieInput = z.infer<typeof CreateCompagnieSchema>
export type UpdateCompagnieInput = z.infer<typeof UpdateCompagnieSchema>
