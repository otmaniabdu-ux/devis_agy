'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Image as ImageIcon, Loader2, Hotel, Plane, Bus, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/errors'

interface ReservationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devisId: string
  devisNumero: string
  hebergements?: { id: string; hotelNom: string; ville: string }[]
}

export function ReservationJpegModal({
  open,
  onOpenChange,
  devisId,
  devisNumero,
  hebergements = [],
}: ReservationModalProps) {
  const [typePrestation, setTypePrestation] = useState<'hotel' | 'vol' | 'transport' | 'global'>('hotel')
  const [targetId, setTargetId] = useState<string>(hebergements[0]?.id ?? '')
  const [generating, setGenerating] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleGenerate = async (downloadDirect = true) => {
    setGenerating(true)
    try {
      const res = await fetch('/api/reservations/export-jpeg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devisId,
          typePrestation,
          targetId: typePrestation === 'hotel' ? targetId : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de la génération du JPEG')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)

      if (downloadDirect) {
        const a = document.createElement('a')
        a.href = url
        a.download = `Reservation-${typePrestation.toUpperCase()}-${devisNumero}.jpeg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        toast.success('Demande de réservation JPEG téléchargée !')
      } else {
        toast.info('Aperçu mis à jour')
      }
    } catch (e: unknown) {
      toast.error(getErrorMessage(e))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-serif">
            <ImageIcon className="w-5 h-5 text-brand-or" />
            Demande de Réservation Fournisseur (Format JPEG)
          </DialogTitle>
          <DialogDescription>
            Générez un voucher officiel au format image (JPEG haute définition), idéal pour un envoi direct sur WhatsApp aux réceptifs saoudiens et compagnies partenaires.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Sélection type prestation */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">
              Prestation concernée
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTypePrestation('hotel')
                  setPreviewUrl(null)
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  typePrestation === 'hotel'
                    ? 'border-brand-or bg-brand-or/15 text-foreground font-bold shadow-sm'
                    : 'border-border/60 hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Hotel className="w-4 h-4 text-brand-or" />
                Hôtel / Séjour
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypePrestation('vol')
                  setPreviewUrl(null)
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  typePrestation === 'vol'
                    ? 'border-brand-bleu-royal bg-brand-bleu-royal/15 text-foreground font-bold shadow-sm'
                    : 'border-border/60 hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Plane className="w-4 h-4 text-brand-bleu-royal" />
                Billetterie Vol
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypePrestation('transport')
                  setPreviewUrl(null)
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  typePrestation === 'transport'
                    ? 'border-emerald-600 bg-emerald-500/15 text-foreground font-bold shadow-sm'
                    : 'border-border/60 hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <Bus className="w-4 h-4 text-emerald-600" />
                Transports VIP
              </button>

              <button
                type="button"
                onClick={() => {
                  setTypePrestation('global')
                  setPreviewUrl(null)
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold gap-1.5 transition-all ${
                  typePrestation === 'global'
                    ? 'border-amber-600 bg-amber-500/15 text-foreground font-bold shadow-sm'
                    : 'border-border/60 hover:bg-accent/40 text-muted-foreground'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                Dossier Global
              </button>
            </div>
          </div>

          {/* Si type hôtel et plusieurs hôtels */}
          {typePrestation === 'hotel' && hebergements.length > 1 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Sélectionnez l'établissement
              </label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un hôtel..." />
                </SelectTrigger>
                <SelectContent>
                  {hebergements.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.hotelNom} ({h.ville})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zone de prévisualisation */}
          {previewUrl && (
            <div className="border border-border/70 rounded-xl p-2 bg-muted/20 flex flex-col items-center justify-center max-h-[300px] overflow-hidden">
              <img
                src={previewUrl}
                alt="Aperçu Bon de Réservation"
                className="max-h-[280px] w-auto object-contain rounded-lg shadow-md border"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!previewUrl ? (
            <Button
              variant="outline"
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="gap-1.5"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Prévisualiser l'image
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleGenerate(false)}
              disabled={generating}
              className="gap-1.5"
            >
              {generating && <Loader2 className="w-4 h-4 animate-spin" />}
              Actualiser l'aperçu
            </Button>
          )}

          <Button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            className="gap-2 bg-brand-or hover:bg-brand-or/90 text-slate-950 font-bold"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger en JPEG (WhatsApp)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
