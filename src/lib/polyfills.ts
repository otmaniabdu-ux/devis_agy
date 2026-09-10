// Polyfill pour les contextes non sécurisés (ex: accès LAN via HTTP http://192.168.x.x:3000)
// Les navigateurs modernes limitent window.crypto.randomUUID aux contextes sécurisés (HTTPS / localhost).
if (typeof window !== 'undefined') {
  if (!window.crypto) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).crypto = {}
  }
  if (typeof window.crypto.randomUUID !== 'function') {
    window.crypto.randomUUID = function randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
      if (typeof window.crypto.getRandomValues === 'function') {
        return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) => {
          const num = Number(c)
          const randomByte = window.crypto.getRandomValues(new Uint8Array(1))[0] ?? 0
          return (num ^ (randomByte & (15 >> (num / 4)))).toString(16)
        }) as `${string}-${string}-${string}-${string}-${string}`
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      }) as `${string}-${string}-${string}-${string}-${string}`
    }
  }
}
