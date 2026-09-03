import { z } from 'zod'

// Helpers
const DateSchema = z.union([z.string(), z.date()]).refine((val) => {
  const d = new Date(val)
  return !isNaN(d.getTime())
}, { message: "Date invalide" })

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

const HebergementSchema = z.object({
  ville: z.string().optional().default('Makkah'),
  hotelId: z.string().optional().nullable(),
  hotelNom: z.string().optional(),
  typeChambre: z.string().optional().default('double'),
  formuleRepas: z.string().optional().default('demi_pension'),
  vue: z.string().optional().default('city'),
  dateCheckin: DateSchema.optional().nullable(),
  dateCheckout: DateSchema.optional().nullable(),
  nbNuitees: z.number().optional(),
  nbChambres: z.union([z.string(), z.number()]).transform(Number).optional().default(1),
  prixNuitChambre: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  devise: z.string().optional().default('SAR'),
})

const TransfertSchema = z.object({
  trajet: z.string().optional(),
  typeVehicule: z.string().optional().default('GMC_Yukon'),
  prix: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  devise: z.string().optional().default('SAR'),
  obligatoire: z.boolean().optional().default(true),
})

const TrainHaramainSchema = z.object({
  trajet: z.string().optional(),
  classe: z.string().optional().default('economique'),
  dateTrain: DateSchema.optional().nullable(),
  prixAdulte: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  prixEnfant: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  devise: z.string().optional().default('SAR'),
})

const PrestationVipSchema = z.object({
  type: z.string().optional().default('autre'),
  descriptionFr: z.string().optional(),
  descriptionAr: z.string().optional().nullable(),
  prix: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  devise: z.string().optional().default('SAR'),
})

const CampMashairSchema = z.object({
  nomCamp: z.string().optional(),
  typeTente: z.string().optional(),
  restauration: z.string().optional(),
  prixAdulte: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  prixEnfant: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  devise: z.string().optional().default('SAR'),
})

const TransportMashairSchema = z.object({
  typeVehicule: z.string().optional(),
  trajet: z.string().optional(),
  prix: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).optional().default('0'),
  typePrix: z.string().optional().default('forfait'),
  devise: z.string().optional().default('SAR'),
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
  visaPrixUnit: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).default('0'),
  visaDevise: z.string().default('SAR'),

  assurancePrixUnit: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).default('0'),
  assuranceDevise: z.string().default('SAR'),

  fraisOnpoPrixUnit: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).default('5000'),
  fraisOnpoDevise: z.string().default('DZD'),

  margeType: MargeTypeEnum.default('pourcentage'),
  margeValeur: z.union([PositiveMoneyStringSchema, z.number()]).transform(String).default('15'),

  statut: DevisStatusEnum.default('brouillon'),
  notesInternes: z.string().optional().nullable(),
  notesClient: z.string().optional().nullable(),
  
  // Optimistic locking (uniquement pour PUT)
  updatedAt: DateSchema.optional(),

  // Arrays (minimal validation pour ne pas bloquer les objets complexes non formatés)
  passagers: z.array(PassagerSchema.partial()).optional(),
  segmentsVol: z.array(SegmentVolSchema.partial()).optional(),
  hebergements: z.array(HebergementSchema.partial()).optional(),
  transferts: z.array(TransfertSchema.partial()).optional(),
  trainsHaramain: z.array(TrainHaramainSchema.partial()).optional(),
  prestationsVip: z.array(PrestationVipSchema.partial()).optional(),
  campsMashair: z.array(CampMashairSchema.partial()).optional(),
  transportsMashair: z.array(TransportMashairSchema.partial()).optional(),
})

// Le schéma pour POST nécessite le clientId
export const CreateDevisSchema = DevisBaseSchema

// Le schéma pour PUT permet un clientId optionnel (déjà existant)
export const UpdateDevisSchema = DevisBaseSchema.partial()

export type CreateDevisInput = z.infer<typeof CreateDevisSchema>
export type UpdateDevisInput = z.infer<typeof UpdateDevisSchema>

// Types des lignes enfants telles que recues du frontend (champs partiels)
export type PassagerPayload = z.input<ReturnType<typeof PassagerSchema.partial>>
export type SegmentVolPayload = z.input<ReturnType<typeof SegmentVolSchema.partial>>
export type HebergementPayload = z.input<ReturnType<typeof HebergementSchema.partial>>
export type TransfertPayload = z.input<ReturnType<typeof TransfertSchema.partial>>
export type TrainHaramainPayload = z.input<ReturnType<typeof TrainHaramainSchema.partial>>
export type PrestationVipPayload = z.input<ReturnType<typeof PrestationVipSchema.partial>>
export type CampMashairPayload = z.input<ReturnType<typeof CampMashairSchema.partial>>
export type TransportMashairPayload = z.input<ReturnType<typeof TransportMashairSchema.partial>>
