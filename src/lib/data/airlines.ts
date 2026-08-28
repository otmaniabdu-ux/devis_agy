export interface CompagnieSeedData {
  nom: string
  codeIata: string
  logoPath?: string
  actif: boolean
}

export const compagniesAeriennes: CompagnieSeedData[] = [
  { nom: 'Air Algérie', codeIata: 'AH', actif: true },
  { nom: 'Saudi Arabian Airlines (Saudia)', codeIata: 'SV', actif: true },
  { nom: 'Flynas', codeIata: 'XY', actif: true },
  { nom: 'Flyadeal', codeIata: 'F3', actif: true },
  { nom: 'Tassili Airlines', codeIata: 'SF', actif: true },
  { nom: 'Turkish Airlines', codeIata: 'TK', actif: true },
  { nom: 'Qatar Airways', codeIata: 'QR', actif: true },
  { nom: 'Emirates', codeIata: 'EK', actif: true },
  { nom: 'EgyptAir', codeIata: 'MS', actif: true },
  { nom: 'Royal Jordanian', codeIata: 'RJ', actif: true },
  { nom: 'Tunisair', codeIata: 'TU', actif: true },
  { nom: 'Flydubai', codeIata: 'FZ', actif: true },
  { nom: 'Air Arabia', codeIata: 'G9', actif: true },
  { nom: 'Gulf Air', codeIata: 'GF', actif: true },
  { nom: 'Oman Air', codeIata: 'WY', actif: true },
  { nom: 'Kuwait Airways', codeIata: 'KU', actif: true },
  { nom: 'Jazeera Airways', codeIata: 'J9', actif: true },
  { nom: 'Nouvelair Tunisie', codeIata: 'BJ', actif: true },
  { nom: 'Air Cairo', codeIata: 'SM', actif: true },
  { nom: 'Nesma Airlines', codeIata: 'NE', actif: true },
  { nom: 'Middle East Airlines (MEA)', codeIata: 'ME', actif: true },
  { nom: 'ITA Airways', codeIata: 'AZ', actif: true },
  { nom: 'Royal Air Maroc', codeIata: 'AT', actif: true },
  { nom: 'Pegasus Airlines', codeIata: 'PC', actif: true },
]
