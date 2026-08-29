import { z } from 'zod'

// Helpers
const DateSchema = z.union([z.string(), z.date()]).refine((val) => {
  const d = new Date(val)
  return !isNaN(d.getTime())
}, { message: "Date invalide" })

const MoneyStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, "Format monétaire invalide (ex: 1250.50)")
const PositiveMoneyStringSchema = z.string().regex(/^\d+(\.\d+)?$/, "Le montant ne peut pas être négatif")

export const DevisStatusEnum = z.enum(['brouillon', 'envoye', 'accepte', 'refuse', 'archive'])
export const VisaTypeEnum = z.enum(['omra_standard', 'touristique', 'hadj'])
export const MargeTypeEnum = z.enum(['pourcentage', 'montant_fixe'])
export const PassengerCategoryEnum = z.enum(['adulte', 'enfant_avec_lit', 'enfant_sans_lit', 'bebe'])

// Schémas enfants
const PassagerSchema = z.object({
  categorie: PassengerCategoryEnum,
  nom: z.string().min(1, "Le nom est requis"),
  prenom: z.string(),
  dateNaissance: DateSchema.optional().nullable(),
  passeportNumero: z.string().optional().nullable(),
  passeportExpiration: DateSchema.optional().nullable(),
})

const SegmentVolSchema = z.object({
  origine: z.string(),
  destination: z.string(),
  dateVol: DateSchema,
  classe: z.enum(['economique', 'affaires', 'premiere']).default('economique'),
  origineRetour: z.string().optional().nullable(),
  destinationRetour: z.string().optional().nullable(),
  dateVolRetour: DateSchema.optional().nullable(),
  classeRetour: z.enum(['economique', 'affaires', 'premiere']).optional().nullable(),
  compagnieId: z.string().optional().nullable(),
  prixAdulte: PositiveMoneyStringSchema.default('0'),
  prixEnfant: PositiveMoneyStringSchema.default('0'),
  prixBebe: PositiveMoneyStringSchema.default('0'),
  devise: z.string().default('SAR'),
})

// Schéma de base Devis
export const DevisBaseSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  dateDepart: DateSchema,
  dateRetour: DateSchema,
  
  // Taux de change (optionnels, ignorés en PUT)
  tauxSarDzd: PositiveMoneyStringSchema.optional(),
  tauxUsdDzd: PositiveMoneyStringSchema.optional(),
  tauxEurDzd: PositiveMoneyStringSchema.optional(),

  visaType: VisaTypeEnum.default('omra_standard'),
  visaPrixUnit: PositiveMoneyStringSchema.default('0'),
  visaDevise: z.string().default('SAR'),

  assurancePrixUnit: PositiveMoneyStringSchema.default('0'),
  assuranceDevise: z.string().default('SAR'),

  fraisOnpoPrixUnit: PositiveMoneyStringSchema.default('5000'),
  fraisOnpoDevise: z.string().default('DZD'),

  margeType: MargeTypeEnum.default('pourcentage'),
  margeValeur: PositiveMoneyStringSchema.default('15'),

  statut: DevisStatusEnum.default('brouillon'),
  notesInternes: z.string().optional().nullable(),
  notesClient: z.string().optional().nullable(),
  
  // Optimistic locking (uniquement pour PUT)
  updatedAt: DateSchema.optional(),

  // Arrays (minimal validation pour ne pas bloquer les objets complexes non formatés)
  passagers: z.array(z.any()).optional(),
  segmentsVol: z.array(z.any()).optional(),
  hebergements: z.array(z.any()).optional(),
  transferts: z.array(z.any()).optional(),
  trainsHaramain: z.array(z.any()).optional(),
  prestationsVip: z.array(z.any()).optional(),
  campsMashair: z.array(z.any()).optional(),
  transportsMashair: z.array(z.any()).optional(),
})

// Le schéma pour POST nécessite le clientId
export const CreateDevisSchema = DevisBaseSchema

// Le schéma pour PUT permet un clientId optionnel (déjà existant)
export const UpdateDevisSchema = DevisBaseSchema.partial()
