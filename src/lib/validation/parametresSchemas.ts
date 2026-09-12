import { z } from 'zod'

const OptionalText = z.string().optional()

export const ParametresAgenceSchema = z.object({
  nomFr: OptionalText,
  nomAr: OptionalText,
  sloganFr: OptionalText,
  sloganAr: OptionalText,
  adresse: OptionalText,
  telephone: OptionalText,
  email: z.string().email('Adresse email invalide').optional().or(z.literal('')),
  rc: OptionalText,
  if: OptionalText,
  art: OptionalText,
  capital: OptionalText,
})

export const TauxChangeInputSchema = z.object({
  code: z.enum(['SAR', 'USD', 'EUR']),
  libelleFr: z.string().min(1, 'Le libellé (FR) est requis'),
  libelleAr: z.string().min(1, 'Le libellé (AR) est requis'),
  tauxDzd: z.union([
    z.string().regex(/^\d+(\.\d+)?$/, 'Le taux doit être un nombre positif'),
    z.number().min(0, 'Le taux doit être un nombre positif'),
  ]),
})

export const UpdateParametresSchema = z
  .object({
    parametres: ParametresAgenceSchema.optional(),
    taux: z.array(TauxChangeInputSchema).optional(),
  })
  .refine((data) => data.parametres !== undefined || data.taux !== undefined, {
    message: 'Aucune donnée à mettre à jour',
  })

export type UpdateParametresPayload = z.infer<typeof UpdateParametresSchema>
