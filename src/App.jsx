import { useState, useRef, useCallback } from 'react'

const CHEERS = [
  { title: 'Cheers!', line: 'Two mugs, one moment. Drink up, sher.' },
  { title: 'Balle Balle!', line: 'Second round — the lion approves.' },
  { title: 'Chak De Phatte!', line: 'Third one’s for the yaars who couldn’t make it.' },
  { title: 'Shava Shava!', line: 'Okay, now we’re just showing off.' },
  { title: 'Sher Mode: ON', line: 'The mug fears you now.' },
  { title: 'Legend Status', line: 'Paani vi pee lo, sher. 💧' },
]

// invite baked into the URL hash, e.g. #c=4&from=Karan
const inviteParams = new URLSearchParams(window.location.hash.slice(1))
const INVITE = inviteParams.get('c')
  ? {
      n: Math.min(Math.max(parseInt(inviteParams.get('c'), 10) || 1, 1), 99),
      from: (inviteParams.get('from') || '').slice(0, 30),
    }
  : null

export default function App() {
  const [cheering, setCheering] = useState(false)
  const [count, setCount] = useState(0)
  const [buying, setBuying] = useState(null) // null | 'flipping' | result text
  const [showInvite, setShowInvite] = useState(!!INVITE)
  const [share, setShare] = useState('idle') // idle | naming | copied
  const [name, setName] = useState(() => localStorage.getItem('sher-name') || '')
  const bubbleLayer = useRef(null)
  const countRef = useRef(0)
  const audioRef = useRef(null)
  const flipTimer = useRef(null)
  const copiedTimer = useRef(null)

  const playClink = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = (audioRef.current ??= new Ctx())
    if (ctx.state === 'suspended') ctx.resume()
    const t = ctx.currentTime
    // two detuned high pings ≈ glass on glass
    ;[1810, 2470].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq + Math.random() * 90
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(i ? 0.1 : 0.18, t + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + i * 0.013)
      osc.stop(t + 0.5)
    })
  }, [])

  const spawnBubbles = useCallback(n => {
    const layer = bubbleLayer.current || document.body
    for (let i = 0; i < n; i++) {
      const b = document.createElement('div')
      b.className = 'bubble'
      const size = 4 + Math.random() * 16
      b.style.width = b.style.height = size + 'px'
      b.style.left = Math.random() * 100 + 'vw'
      const dur = 1.8 + Math.random() * 1.8
      b.style.transition = `transform ${dur}s ease-out, opacity ${dur}s ease-out`
      layer.appendChild(b)
      requestAnimationFrame(() => {
        b.style.transform = `translateY(-${70 + Math.random() * 40}vh)`
        b.style.opacity = '0'
      })
      setTimeout(() => b.remove(), dur * 1000 + 100)
    }
  }, [])

  const clink = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([30, 40, 30])
    countRef.current += 1
    setCount(countRef.current)
    setShowInvite(false)
    playClink()
    // rounds get rowdier: more bubbles every clink, capped
    spawnBubbles(Math.min(26 + countRef.current * 4, 50))
    setCheering(true)
  }, [playClink, spawnBubbles])

  const flipCoin = useCallback(() => {
    setBuying('flipping')
    flipTimer.current = setTimeout(() => {
      setBuying(Math.random() < 0.5 ? 'You’re buying! 💸' : 'They’re buying! 🎉')
    }, 1400)
  }, [])

  const sendInvite = useCallback(async () => {
    const trimmed = name.trim().slice(0, 30)
    localStorage.setItem('sher-name', trimmed)
    const hash = `#c=${countRef.current}${trimmed ? `&from=${encodeURIComponent(trimmed)}` : ''}`
    const url = window.location.origin + window.location.pathname + hash
    const text = `🍻 ${trimmed || 'A yaar'} clinked ${countRef.current} round${countRef.current === 1 ? '' : 's'} on Sher-e-Beer — your turn!`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Sher-e-Beer', text, url })
        setShare('idle')
        return
      } catch {
        /* user cancelled or share failed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setShare('copied')
      clearTimeout(copiedTimer.current)
      copiedTimer.current = setTimeout(() => setShare('idle'), 2600)
    } catch {
      setShare('idle')
    }
  }, [name])

  const pourAnother = useCallback(() => {
    clearTimeout(flipTimer.current)
    setBuying(null)
    setShare('idle')
    setCheering(false)
  }, [])

  const msg = CHEERS[Math.min(Math.max(count - 1, 0), CHEERS.length - 1)]

  return (
    <>
      <main className="stage">
        <div className="eyebrow">ਸ਼ੇਰ-ਏ-ਬੀਅਰ &middot; Est. Right Now</div>

        <div className="wordmark">
          <div className="top">Sher<span className="dash">-e-</span></div>
          <div className="beer">Beer</div>
        </div>

        <div className="ornament" aria-hidden="true">
          <span className="rule" /><span className="gem">✦</span><span className="rule" />
        </div>

        <div className="crest">
          <div className="crest-ring" aria-hidden="true" />
          <div className="mascot">🦁</div>
        </div>

        {showInvite ? (
          <p className="challenge">
            🍻 <strong>{INVITE.from || 'A yaar'}</strong> clinked{' '}
            {INVITE.n} round{INVITE.n === 1 ? '' : 's'} &amp; sent it to you — clink back!
          </p>
        ) : (
          <p className="tagline">The lion doesn&rsquo;t drink alone. Show this. Share a beer.</p>
        )}

        <button className="mug-btn" onClick={clink}>
          <span className="sheen" aria-hidden="true" />
          <span className="clink">🍺</span> {showInvite ? 'Clink back' : 'Cheers, yaar'}
        </button>
        <div className="hint">tap to clink</div>
      </main>

      <footer className="credit">
        Designed by{' '}
        <a href="https://portfoliohehe.netlify.app/" target="_blank" rel="noopener noreferrer">
          Saranjit Thind
        </a>
      </footer>

      <section className={`cheers${cheering ? ' show' : ''}`}>
        <div className="clink-big">🍻</div>
        <h2>{msg.title}</h2>
        <div className="ornament" aria-hidden="true">
          <span className="rule" /><span className="gem">✦</span><span className="rule" />
        </div>
        <p>{msg.line}</p>
        <div className="count-chip">🍺 &times; {count} clinked</div>

        <div className="buying">
          {buying === null && (
            <button className="coin-btn" onClick={flipCoin}>
              Who&rsquo;s buying? 🪙
            </button>
          )}
          {buying === 'flipping' && <div className="coin-spin" aria-label="flipping a coin">🪙</div>}
          {buying !== null && buying !== 'flipping' && (
            <div className="buying-result">{buying}</div>
          )}
        </div>

        <div className="share-row">
          {share === 'idle' && (
            <button className="coin-btn" onClick={() => setShare('naming')}>
              Send this round to a yaar 📤
            </button>
          )}
          {share === 'naming' && (
            <form
              className="share-form"
              onSubmit={e => {
                e.preventDefault()
                sendInvite()
              }}
            >
              <input
                className="name-input"
                type="text"
                placeholder="your name, yaar? (optional)"
                maxLength={30}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <button type="submit" className="again send-btn">Send 🍻</button>
            </form>
          )}
          {share === 'copied' && (
            <div className="buying-result">Link copied — go paste it 💛</div>
          )}
        </div>

        <button className="again" onClick={pourAnother}>
          Pour another
        </button>
      </section>

      <div ref={bubbleLayer} />
    </>
  )
}
