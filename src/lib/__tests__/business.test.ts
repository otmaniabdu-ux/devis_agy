import { describe, it, expect } from 'vitest'
import {
  calculerNbNuitees,
  verifierAlertePasseport,
  cleMensuelle,
  formatNumeroDevis,
} from '@/lib/business'

describe('Règles Métier (business.ts)', () => {
  describe('calculerNbNuitees()', () => {
    it('calcule correctement la différence en jours (3 nuits)', () => {
      expect(calculerNbNuitees('2026-01-01', '2026-01-04')).toBe(3)
    })

    it('retourne 0 si même jour', () => {
      expect(calculerNbNuitees('2026-01-01', '2026-01-01')).toBe(0)
    })

    it('retourne 0 si dates inversées', () => {
      expect(calculerNbNuitees('2026-01-04', '2026-01-01')).toBe(0)
    })

    it('fonctionne avec des dates ISO strings et objets Date', () => {
      expect(calculerNbNuitees(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-04T00:00:00Z'))).toBe(3)
      expect(calculerNbNuitees('2026-01-01T15:00:00Z', '2026-01-04T10:00:00Z')).toBe(3)
    })

    it('retourne 0 si les dates sont invalides', () => {
      expect(calculerNbNuitees('invalid', '2026-01-04')).toBe(0)
    })
  })

  describe('verifierAlertePasseport()', () => {
    it('déclenche l\'alerte si le passeport expire 5 mois 29 jours après le retour', () => {
      // Retour le 2026-01-01, seuil 6 mois = 2026-07-01
      // Expiration le 2026-06-30 -> ALERTE
      const res = verifierAlertePasseport('2026-06-30', '2026-01-01')
      expect(res.alerte).toBe(true)
    })

    it('ne déclenche PAS l\'alerte si le passeport expire exactement 6 mois après le retour', () => {
      const res = verifierAlertePasseport('2026-07-01', '2026-01-01')
      expect(res.alerte).toBe(false)
    })

    it('ne déclenche PAS l\'alerte si le passeport expire 7 mois après le retour', () => {
      const res = verifierAlertePasseport('2026-08-01', '2026-01-01')
      expect(res.alerte).toBe(false)
    })

    it('ne déclenche PAS d\'alerte si le passeport est null', () => {
      const res = verifierAlertePasseport(null, '2026-01-01')
      expect(res.alerte).toBe(false)
    })

    it('ne déclenche PAS d\'alerte si la date d\'expiration est invalide', () => {
      const res = verifierAlertePasseport('invalid', '2026-01-01')
      expect(res.alerte).toBe(false)
    })
  })

  describe('cleMensuelle()', () => {
    it('génère la bonne clé pour une date donnée', () => {
      expect(cleMensuelle(new Date('2026-08-15'))).toBe('DEVIS-2026-08')
    })

    it('ajoute le padding pour les mois < 10 (Janvier)', () => {
      expect(cleMensuelle(new Date('2026-01-01'))).toBe('DEVIS-2026-01')
    })
  })

  describe('formatNumeroDevis()', () => {
    it('formate correctement le numéro avec 3 chiffres', () => {
      expect(formatNumeroDevis('DEVIS-2026-08', 1)).toBe('DEVIS-2026-08-001')
      expect(formatNumeroDevis('DEVIS-2026-08', 42)).toBe('DEVIS-2026-08-042')
      expect(formatNumeroDevis('DEVIS-2026-08', 999)).toBe('DEVIS-2026-08-999')
    })
  })
})
