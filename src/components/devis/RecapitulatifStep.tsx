'use client'

import { FileDown, FileText, Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fmt, fmtDate, downloadPdf } from '@/lib/client-utils'
import { D } from '@/lib/money'
import { toast } from 'sonner'
import { useDevisStore } from '@/store/useDevisStore'

interface Props {
  onSaved: () => Promise<string | null>
}

export function RecapitulatifStep({ onSaved }: Props) {
  const { devis, resultatCalcul } = useDevisStore()

  if (!devis) return null

  const nbPassagers = devis.passagers.length
  const clientNom = devis.clientId ? 'Client sélectionné' : '—'

  // Recalcule les sous-totaux par poste
  const parPoste: Record<string, number> = {}
  if (resultatCalcul) {
    for (const l of resultatCalcul.lignes) {
      parPoste[l.poste] = (parPoste[l.poste] ?? 0) + Number(D(l.montantDzd))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg" style={{ fontFamily: 'Georgia, serif' }}>Récapitulatif du devis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Vérifiez les informations ci-dessous puis générez le PDF et/ou sauvegardez.
        </p>
      </div>

      {/* Synthèse générale */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-muted/40 rounded-lg">
          <p className="text-[10px] uppercase text-muted-foreground">Numéro</p>
          <p className="font-mono font-bold mt-1">{devis.numero ?? '— auto-généré —'}</p>
        </div>
        <div className="p-4 bg-muted/40 rounded-lg">
          <p className="text-[10px] uppercase text-muted-foreground">Voyage</p>
          <p className="font-semibold text-sm mt-1">
            {fmtDate(devis.dateDepart)} → {fmtDate(devis.dateRetour)}
          </p>
        </div>
        <div className="p-4 bg-muted/40 rounded-lg">
          <p className="text-[10px] uppercase text-muted-foreground">Passagers</p>
          <p className="font-bold mt-1">{nbPassagers} pax</p>
        </div>
        <div className="p-4 bg-muted/40 rounded-lg">
          <p className="text-[10px] uppercase text-muted-foreground">Statut</p>
          <p className="font-bold mt-1 capitalize">{devis.statut}</p>
        </div>
      </div>

      {/* Détail par poste */}
      {resultatCalcul ? (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-bleu-nuit text-white">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase">Prestation</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase">Nombre</th>
                <th className="text-right px-4 py-3 font-semibold text-xs uppercase">Montant DZD</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(parPoste).map(([poste, montant], i) => (
                <tr key={poste} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                  <td className="px-4 py-2.5 font-medium">{poste}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                    {resultatCalcul.lignes.filter((l: any) => l.poste === poste).length} ligne(s)
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{fmt(String(montant))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted border-t-2 border-border">
                <td className="px-4 py-3 font-bold" colSpan={2}>Coût net total</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{fmt(resultatCalcul.coutNetDzd)}</td>
              </tr>
              <tr className="bg-brand-or/10 border-t border-border">
                <td className="px-4 py-3 font-bold" colSpan={2}>
                  Marge agence ({devis.margeType === 'pourcentage' ? `${devis.margeValeur}%` : 'montant fixe'})
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-brand-or">{fmt(resultatCalcul.margeMontantDzd)}</td>
              </tr>
              <tr className="bg-brand-rouge text-white border-t-2 border-brand-rouge">
                <td className="px-4 py-3 font-bold text-base" colSpan={2}>PRIX DE VENTE TOTAL</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-lg">{fmt(resultatCalcul.prixVenteDzd)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center bg-muted/40 rounded-lg border-2 border-dashed border-border">
          <p className="text-sm text-muted-foreground mb-3">
            ⚠ Sauvegardez le devis pour voir le récapitulatif calculé.
          </p>
          <Button onClick={() => onSaved()} className="gap-2 bg-brand-rouge hover:bg-brand-rouge/90">
            <Save className="w-4 h-4" /> Sauvegarder et calculer
          </Button>
        </div>
      )}

      {/* Actions finales */}
      {devis.id && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Button
            onClick={() => downloadPdf(devis.id, 'client', devis.numero ?? '').catch((e) => toast.error(e.message))}
            className="gap-2 bg-brand-bleu-royal hover:bg-brand-bleu-royal/90 h-12"
          >
            <FileDown className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold text-sm">PDF Client</div>
              <div className="text-[10px] opacity-80">Bilingue FR/AR — prix de vente</div>
            </div>
          </Button>
          <Button
            onClick={() => downloadPdf(devis.id, 'interne', devis.numero ?? '').catch((e) => toast.error(e.message))}
            className="gap-2 bg-brand-or hover:bg-brand-or/90 text-brand-bleu-nuit h-12"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold text-sm">PDF Interne</div>
              <div className="text-[10px] opacity-80">Avec marge et coût net</div>
            </div>
          </Button>
          <Button
            onClick={() => onSaved().then(() => {})}
            variant="outline"
            className="gap-2 h-12"
          >
            <Save className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold text-sm">Sauvegarder</div>
              <div className="text-[10px] opacity-80">Mettre à jour</div>
            </div>
          </Button>
        </div>
      )}
    </div>
  )
}
