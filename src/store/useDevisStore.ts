import { create } from 'zustand'
import { api } from '@/lib/client-utils'
import { fmtDateInput } from '@/lib/client-utils'
import { toast } from 'sonner'

export interface DevisData {
  id?: string
  numero?: string
  clientId: string
  dateDepart: string
  dateRetour: string
  visaType: string
  visaPrixUnit: string
  visaDevise: string
  assurancePrixUnit: string
  assuranceDevise: string
  margeType: 'pourcentage' | 'montant_fixe'
  margeValeur: string
  statut: string
  notesClient: string
  notesInternes: string
  tauxSarDzd: string
  tauxUsdDzd: string
  tauxEurDzd: string
  passagers: any[]
  segmentsVol: any[]
  hebergements: any[]
  transferts: any[]
  trainsHaramain: any[]
  prestationsVip: any[]
  campsMashair: any[]
  transportsMashair: any[]
}

interface DevisStore {
  // State
  devis: DevisData | null
  clients: any[]
  loading: boolean
  saving: boolean
  resultatCalcul: any | null

  // Actions
  load: (editDevisId: string | null) => Promise<void>
  updateDevis: (updater: (draft: DevisData) => Partial<DevisData> | void) => void
  recalc: () => Promise<void>
  save: (silent?: boolean) => Promise<string | null>
  reset: () => void
}

export const useDevisStore = create<DevisStore>((set, get) => ({
  devis: null,
  clients: [],
  loading: true,
  saving: false,
  resultatCalcul: null,

  reset: () => set({ devis: null, clients: [], loading: true, saving: false, resultatCalcul: null }),

  load: async (editDevisId) => {
    set({ loading: true })
    try {
      const cls = await api('/api/clients')
      const paramsRes = await api('/api/parametres')
      const defaultTaux: Record<string, string> = {}
      for (const t of paramsRes.taux ?? []) {
        defaultTaux[t.code] = t.tauxDzd
      }

      if (editDevisId) {
        const d = await api(`/api/devis/${editDevisId}`)
        set({
          clients: cls,
          devis: {
            id: d.id,
            numero: d.numero,
            clientId: d.clientId,
            dateDepart: fmtDateInput(d.dateDepart),
            dateRetour: fmtDateInput(d.dateRetour),
            visaType: d.visaType,
            visaPrixUnit: d.visaPrixUnit,
            visaDevise: d.visaDevise,
            assurancePrixUnit: d.assurancePrixUnit,
            assuranceDevise: d.assuranceDevise,
            margeType: d.margeType,
            margeValeur: d.margeValeur,
            statut: d.statut,
            notesClient: d.notesClient ?? '',
            notesInternes: d.notesInternes ?? '',
            tauxSarDzd: d.tauxSarDzd,
            tauxUsdDzd: d.tauxUsdDzd,
            tauxEurDzd: d.tauxEurDzd,
            passagers: d.passagers.map((p: any) => ({
              ...p,
              dateNaissance: fmtDateInput(p.dateNaissance),
              passeportExpiration: fmtDateInput(p.passeportExpiration),
            })),
            segmentsVol: d.segmentsVol.map((s: any, idx: number) => ({
              ...s,
              typeVol: s.typeVol || (idx === 0 ? 'aller' : 'retour'),
              dateVol: fmtDateInput(s.dateVol) + 'T' + (s.dateVol ? new Date(s.dateVol).toTimeString().slice(0, 5) : '08:00'),
              origineRetour: s.origineRetour ?? '',
              destinationRetour: s.destinationRetour ?? '',
              dateVolRetour: s.dateVolRetour ? (fmtDateInput(s.dateVolRetour) + 'T' + new Date(s.dateVolRetour).toTimeString().slice(0, 5)) : '',
              classeRetour: s.classeRetour ?? s.classe ?? 'economique',
            })),
            hebergements: d.hebergements.map((h: any) => ({
              ...h,
              dateCheckin: fmtDateInput(h.dateCheckin),
              dateCheckout: fmtDateInput(h.dateCheckout),
            })),
            transferts: d.transferts,
            trainsHaramain: d.trainsHaramain.map((t: any) => ({
              ...t,
              dateTrain: fmtDateInput(t.dateTrain) + 'T' + new Date(t.dateTrain).toTimeString().slice(0, 5),
            })),
            prestationsVip: d.prestationsVip,
            campsMashair: d.campsMashair || [],
            transportsMashair: d.transportsMashair || [],
          },
          resultatCalcul: d._resultatCalcul,
          loading: false,
        })
      } else {
        const today = new Date()
        const future = new Date()
        future.setDate(future.getDate() + 14)
        set({
          clients: cls,
          devis: {
            clientId: cls[0]?.id ?? '',
            dateDepart: fmtDateInput(today),
            dateRetour: fmtDateInput(future),
            visaType: 'omra_standard',
            visaPrixUnit: '450',
            visaDevise: 'SAR',
            assurancePrixUnit: '5000',
            assuranceDevise: 'DZD',
            margeType: 'pourcentage',
            margeValeur: '15',
            statut: 'brouillon',
            notesClient: '',
            notesInternes: '',
            tauxSarDzd: defaultTaux.SAR ?? '35.50',
            tauxUsdDzd: defaultTaux.USD ?? '240.00',
            tauxEurDzd: defaultTaux.EUR ?? '260.00',
            passagers: [],
            segmentsVol: [],
            hebergements: [],
            transferts: [],
            trainsHaramain: [],
            prestationsVip: [],
            campsMashair: [],
            transportsMashair: [],
          },
          loading: false,
        })
      }
    } catch (e: any) {
      toast.error(e.message)
      set({ loading: false })
    }
  },

  updateDevis: (updater) => {
    set((state) => {
      if (!state.devis) return state
      // On passe un clone profond ou superficiel de l'état actuel et on recup le partial
      const nextDevis = { ...state.devis }
      const patch = updater(nextDevis)
      if (patch) {
        return { devis: { ...nextDevis, ...patch } }
      }
      return { devis: nextDevis }
    })
  },

  recalc: async () => {
    const devis = get().devis
    if (!devis?.id) return
    try {
      const r = await api(`/api/devis/${devis.id}/calcul`, { method: 'POST' })
      set({ resultatCalcul: r })
    } catch (e) {
      // silent fail
    }
  },

  save: async (silent = false) => {
    const devis = get().devis
    if (!devis) return null
    set({ saving: true })
    try {
      // Nettoyage du payload (similaire à ce qui était fait manuellement)
      const payload = {
        ...devis,
        passagers: devis.passagers.map((p) => ({
          categorie: p.categorie, nom: p.nom, prenom: p.prenom,
          dateNaissance: p.dateNaissance || null, passeportNumero: p.passeportNumero || null,
          passeportExpiration: p.passeportExpiration || null,
        })),
        segmentsVol: devis.segmentsVol.map((s) => ({
          origine: s.origine, destination: s.destination, dateVol: s.dateVol,
          classe: s.classe, origineRetour: s.origineRetour || null,
          destinationRetour: s.destinationRetour || null, dateVolRetour: s.dateVolRetour || null,
          classeRetour: s.classeRetour || null, compagnieId: s.compagnieId || null,
          prixAdulte: s.prixAdulte, prixEnfant: s.prixEnfant, prixBebe: s.prixBebe, devise: s.devise,
        })),
        hebergements: devis.hebergements.map((h) => ({
          ville: h.ville, hotelId: h.hotelId || null, hotelNom: h.hotelNom,
          typeChambre: h.typeChambre, formuleRepas: h.formuleRepas, vue: h.vue,
          dateCheckin: h.dateCheckin, dateCheckout: h.dateCheckout,
          nbChambres: h.nbChambres, prixNuitChambre: h.prixNuitChambre, devise: h.devise,
        })),
      }

      let savedId: string
      if (devis.id) {
        await api(`/api/devis/${devis.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        savedId = devis.id
        if (!silent) toast.success('Devis mis à jour')
      } else {
        const created = await api('/api/devis', { method: 'POST', body: JSON.stringify(payload) })
        savedId = created.id
        set({ devis: { ...devis, id: created.id, numero: created.numero } })
        if (!silent) toast.success(`Devis ${created.numero} créé`)
      }
      
      // Recalcule après save
      try {
        const r = await api(`/api/devis/${savedId}/calcul`, { method: 'POST' })
        set({ resultatCalcul: r })
      } catch {}

      return savedId
    } catch (e: any) {
      toast.error(e.message)
      return null
    } finally {
      set({ saving: false })
    }
  },
}))
