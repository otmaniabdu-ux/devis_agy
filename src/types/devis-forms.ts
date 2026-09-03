/**
 * Types de formulaires UI — état du store devis (useDevisStore) et catalogues.
 * Conformément aux règles financières du projet, tous les montants sont des
 * strings décimales manipulées via decimal.js (jamais des `number` JS).
 * Les dates sont des strings au format input HTML (`yyyy-MM-dd` / `yyyy-MM-ddTHH:mm`).
 */

export interface PassagerForm {
  id?: string
  categorie: string
  nom: string
  prenom: string
  dateNaissance: string
  passeportNumero: string
  passeportExpiration: string
}

export interface SegmentVolForm {
  id?: string
  typeVol?: string
  origine: string
  destination: string
  dateVol: string
  classe: string
  origineRetour?: string
  destinationRetour?: string
  dateVolRetour?: string
  classeRetour?: string
  compagnieId?: string
  prixAdulte: string
  prixEnfant: string
  prixBebe: string
  devise: string
}

export interface HebergementForm {
  id?: string
  ville: string
  hotelId?: string
  hotelNom?: string
  typeChambre: string
  formuleRepas: string
  vue: string
  dateCheckin: string
  dateCheckout: string
  nbChambres: number
  prixNuitChambre: string
  devise: string
}

export interface TransfertForm {
  id?: string
  trajet: string
  typeVehicule: string
  prix: string
  devise: string
  obligatoire: boolean
}

export interface TrainHaramainForm {
  id?: string
  trajet: string
  classe: string
  dateTrain: string
  prixAdulte: string
  prixEnfant: string
  devise: string
}

export interface PrestationVipForm {
  id?: string
  type: string
  descriptionFr: string
  descriptionAr?: string | null
  prix: string
  devise: string
}

export interface CampMashairForm {
  id?: string
  nomCamp: string
  typeTente: string
  restauration: string
  prixAdulte: string
  prixEnfant: string
  devise: string
}

export interface TransportMashairForm {
  id?: string
  typeVehicule: string
  trajet: string
  prix: string
  typePrix: string
  devise: string
}

export interface ClientItem {
  id: string
  type: string
  nom: string
  prenom?: string | null
  raisonSociale?: string | null
  telephone?: string | null
  email?: string | null
  adresse?: string | null
  notes?: string | null
  createdAt?: string
}

export interface CompagnieItem {
  id: string
  nom: string
  codeIata?: string | null
}

export interface HotelCatalogueItem {
  id: string
  nom: string
  nomAr?: string | null
  ville: string
  etoiles: number
  distanceHaram?: number | null
  prixSingleSar: string
  prixDoubleSar: string
  prixTripleSar: string
  prixQuadrupleSar: string
  devise: string
}

export interface HotelForm {
  ville: string
  nom: string
  nomAr: string
  etoiles: number
  distanceHaram: string
  prixSingleSar: string
  prixDoubleSar: string
  prixTripleSar: string
  prixQuadrupleSar: string
}

export interface CompagnieForm {
  nom: string
  codeIata: string
}
