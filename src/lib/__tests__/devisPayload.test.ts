import { describe, it, expect } from 'vitest'
import {
  safeDate,
  mapPassager,
  mapSegmentVol,
  mapHebergement,
  mapTransfert,
  mapTrain,
  mapPrestation,
  mapCampMashair,
  mapTransportMashair,
} from '@/lib/devisPayload'

describe('devisPayload (Mappers pures)', () => {
  describe('safeDate()', () => {
    it('retourne null pour les valeurs nulles, undefined ou vides', () => {
      expect(safeDate(null)).toBeNull()
      expect(safeDate(undefined)).toBeNull()
      expect(safeDate('')).toBeNull()
      expect(safeDate('   ')).toBeNull()
    })

    it('parse correctement YYYY-MM-DD en Date ISO minuit UTC', () => {
      const d = safeDate('2026-01-15')
      expect(d).toBeInstanceOf(Date)
      expect(d?.toISOString()).toBe('2026-01-15T00:00:00.000Z')
    })

    it('retourne directement un objet Date valide', () => {
      const original = new Date('2026-01-15T12:00:00Z')
      const d = safeDate(original)
      expect(d).toBe(original)
    })

    it('retourne null pour une date invalide', () => {
      expect(safeDate('invalid')).toBeNull()
      expect(safeDate(new Date('invalid'))).toBeNull()
    })
  })

  describe('mapPassager()', () => {
    it('mappe un passager complet', () => {
      const p = mapPassager({
        categorie: 'enfant_avec_lit',
        nom: 'Doe',
        prenom: 'John',
        dateNaissance: '2015-01-01',
        passeportNumero: 'AB123456',
        passeportExpiration: '2030-01-01',
      }, 'devis-123')

      expect(p.devisId).toBe('devis-123')
      expect(p.categorie).toBe('enfant_avec_lit')
      expect(p.nom).toBe('Doe')
      expect(p.prenom).toBe('John')
      expect(p.passeportNumero).toBe('AB123456')
      expect(p.dateNaissance).toBeInstanceOf(Date)
      expect(p.passeportExpiration).toBeInstanceOf(Date)
    })

    it('fournit des valeurs par défaut pour les champs manquants', () => {
      const p = mapPassager({})
      expect(p.categorie).toBe('adulte')
      expect(p.nom).toBe('')
      expect(p.prenom).toBe('')
      expect(p.dateNaissance).toBeNull()
      expect(p.passeportNumero).toBeNull()
      expect(p.passeportExpiration).toBeNull()
      expect(p.devisId).toBeUndefined()
    })
  })

  describe('mapHebergement()', () => {
    it('calcule le nombre de nuitées si non fourni', () => {
      const h = mapHebergement({
        dateCheckin: '2026-01-01',
        dateCheckout: '2026-01-04',
      })
      expect(h.nbNuitees).toBe(3)
    })

    it('fournit la devise SAR par défaut et convertit les prix en String', () => {
      const h = mapHebergement({
        prixNuitChambre: 250,
      })
      expect(h.devise).toBe('SAR')
      expect(h.prixNuitChambre).toBe('250')
    })
  })

  describe('mapTransfert()', () => {
    it('fournit les valeurs par défaut pour un transfert vide', () => {
      const t = mapTransfert({})
      expect(t.typeVehicule).toBe('GMC_Yukon')
      expect(t.prix).toBe('0')
      expect(t.devise).toBe('SAR')
      expect(t.obligatoire).toBe(true)
      expect(t.ordre).toBe(0)
    })
  })

  describe('mapTrain()', () => {
    it('fournit les valeurs par défaut', () => {
      const t = mapTrain({})
      expect(t.classe).toBe('economique')
      expect(t.prixAdulte).toBe('0')
      expect(t.prixEnfant).toBe('0')
      expect(t.devise).toBe('SAR')
    })
  })

  describe('mapPrestation()', () => {
    it('fournit les valeurs par défaut', () => {
      const p = mapPrestation({})
      expect(p.type).toBe('autre')
      expect(p.prix).toBe('0')
      expect(p.devise).toBe('SAR')
    })
  })
})
