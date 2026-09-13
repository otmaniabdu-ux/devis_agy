import { z } from 'zod'

// Champ libre du formulaire paramètres : la vue renvoie l'enregistrement complet
// tel que lu en base, où les champs optionnels peuvent valoir null.
// null est accepté puis transformé en undefined = "ne pas modifier" côté use case.
const OptionalText = z.string().nullish().transform((v) => v ?? undefined)

export const ParametresAgenceSchema = z.object({
  nomFr: OptionalText,
  nomAr: OptionalText,
  sloganFr: OptionalText,
  sloganAr: OptionalText,
  adresse: OptionalText,
  telephone: OptionalText,
  // Champ d'affichage libre : la base peut contenir plusieurs emails composés
  // (ex: "a@x.com / b@y.com") — pas de validation email stricte ici.
  email: OptionalText,
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
