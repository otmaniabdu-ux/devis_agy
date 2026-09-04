import { z } from 'zod'

// Enum pour le type de client (doit correspondre au schéma Prisma)
export const ClientTypeEnum = z.enum(['particulier', 'societe'])

// Schéma commun pour la création et la mise à jour
const clientCoreSchema = z.object({
  type: ClientTypeEnum.default('particulier'),
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.union([z.string().min(2, "Le prénom doit contenir au moins 2 caractères"), z.literal('')]).optional().nullable(),
  raisonSociale: z.union([z.string().min(2, "La raison sociale doit contenir au moins 2 caractères"), z.literal('')]).optional().nullable(),
  telephone: z.union([z.string().min(8, "Le numéro de téléphone est invalide"), z.literal('')]).optional().nullable(),
  email: z.union([z.string().email("Adresse email invalide"), z.literal('')]).optional().nullable(),
  adresse: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(data => {
  // Validation croisée : si c'est une société, la raison sociale est souvent requise, mais
  // pour rester souple (comme le code actuel), on ne bloque pas si elle est manquante.
  // Cependant, si type = particulier, on exige un prénom.
  if (data.type === 'particulier' && !data.prenom) {
    return false
  }
  return true
}, {
  message: "Le prénom est requis pour un particulier.",
  path: ["prenom"]
})

// Export des schémas spécifiques
export const CreateClientSchema = clientCoreSchema
export const UpdateClientSchema = clientCoreSchema

// Types inférés
export type CreateClientInput = z.infer<typeof CreateClientSchema>
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>
