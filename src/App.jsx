import { useState, useRef, useCallback, useEffect } from 'react'

const CHEERS = [
  { title: 'Cheers!', line: 'Two mugs, one moment. Drink up, sher.' },
  { title: 'Balle Balle!', line: 'Second round — the lion approves.' },
  { title: 'Chak De Phatte!', line: 'Third one’s for the yaars who couldn’t make it.' },
  { title: 'Shava Shava!', line: 'Okay, now we’re just showing off.' },
  { title: 'Sher Mode: ON', line: 'The mug fears you now.' },
  { title: 'Legend Status', line: 'Paani vi pee lo, sher. 💧' },
]

const TAUNTS = [
  'Oye, the mug’s getting warm, sher… 🫗',
  'Lions don’t stop at one. Just saying.',
  'The yaars are waiting, sher.',
  'Thirsty silence detected. 👀',
]

const FLIP_LINES = [
  'consulting the lion…',
  'checking both wallets…',
  'asking the bartender…',
  'reading the foam…',
]

// invite baked into the URL hash, e.g. #c=4&from=Karan
const inviteParams = new URLSearchParams(window.location.hash.slice(1))
const INVITE = inviteParams.get('c')
  ? {
      n: Math.min(Math.max(parseInt(inviteParams.get('c'), 10) || 1, 1), 99),
      from: (inviteParams.get('from') || '').slice(0, 30),
    }
  : null

const IS_TOUCH = typeof window !== 'undefined' && 'ontouchstart' in window

export default function App() {
  const [cheering, setCheering] = useState(false)
  const [count, setCount] = useState(0)
  const [buying, setBuying] = useState(null) // null | 'flipping' | result text
  const [flipLine, setFlipLine] = useState(0)
  const [showInvite, setShowInvite] = useState(!!INVITE)
  const [share, setShare] = useState('idle') // idle | naming | copied
  const [name, setName] = useState(() => localStorage.getItem('sher-name') || '')
  const [taunt, setTaunt] = useState(null)
  const [canShake, setCanShake] = useState(false)
  const [total, setTotal] = useState(() => {
    try { return parseInt(localStorage.getItem('sher-total'), 10) || 0 } catch { return 0 }
  })
  const [roaring, setRoaring] = useState(false)
  const roarTimer = useRef(null)
  const roarEndTimer = useRef(null)
  const bubbleLayer = useRef(null)
  const countRef = useRef(0)
  const audioRef = useRef(null)
  const flipTimer = useRef(null)
  const flipCycle = useRef(null)
  const copiedTimer = useRef(null)
  const clinkRef = useRef(() => {})
  const motionReady = useRef(false)

  const getCtx = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = (audioRef.current ??= new Ctx())
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }, [])

  const playClink = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
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
  }, [getCtx])

  // milestone rounds: rising cascade of pings + a fizzy swell
  const playFlourish = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    ;[1500, 1900, 2400, 3100].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const at = t + i * 0.11
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.16, at + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(at)
      osc.stop(at + 0.55)
    })
    const dur = 0.7
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 5200
    bp.Q.value = 0.8
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.06, t + 0.25)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    noise.connect(bp).connect(ng).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + dur)
  }, [getCtx])

  // pour: falling filtered fizz + a few descending glugs
  const playPour = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const dur = 0.55
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 1.2
    bp.frequency.setValueAtTime(900, t)
    bp.frequency.exponentialRampToValueAtTime(350, t + dur)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.16, t + 0.06)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    noise.connect(bp).connect(ng).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + dur)
    ;[0.08, 0.24, 0.4].forEach((off, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220 - i * 40, t + off)
      osc.frequency.exponentialRampToValueAtTime(120 - i * 20, t + off + 0.1)
      gain.gain.setValueAtTime(0.0001, t + off)
      gain.gain.exponentialRampToValueAtTime(0.11, t + off + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + off + 0.14)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t + off)
      osc.stop(t + off + 0.16)
    })
  }, [getCtx])

  // easter egg: hold the lion — low sawtooth growl + band-swept rumble
  const playRoar = useCallback(() => {
    const ctx = getCtx()
    if (!ctx) return
    const t = ctx.currentTime
    const dur = 0.9
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.exponentialRampToValueAtTime(65, t + dur)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 420
    const og = ctx.createGain()
    og.gain.setValueAtTime(0.0001, t)
    og.gain.exponentialRampToValueAtTime(0.4, t + 0.08)
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(lp).connect(og).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + dur)
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(320, t)
    bp.frequency.exponentialRampToValueAtTime(110, t + dur)
    bp.Q.value = 0.9
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(0.0001, t)
    ng.gain.exponentialRampToValueAtTime(0.22, t + 0.1)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    noise.connect(bp).connect(ng).connect(ctx.destination)
    noise.start(t)
    noise.stop(t + dur)
  }, [getCtx])

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

  // golden beer rain over everything on milestone rounds
  const spawnBeerRain = useCallback(() => {
    const layer = bubbleLayer.current || document.body
    for (let i = 0; i < 14; i++) {
      const d = document.createElement('div')
      d.className = 'beer-drop'
      d.textContent = Math.random() < 0.5 ? '🍺' : '🍻'
      d.style.left = Math.random() * 100 + 'vw'
      d.style.fontSize = 22 + Math.random() * 26 + 'px'
      const dur = 1.4 + Math.random() * 1.2
      d.style.animationDuration = dur + 's'
      d.style.animationDelay = Math.random() * 0.6 + 's'
      layer.appendChild(d)
      setTimeout(() => d.remove(), (dur + 1) * 1000)
    }
  }, [])

  const attachShake = useCallback(() => {
    if (motionReady.current) return
    motionReady.current = true
    setCanShake(true)
    let last = 0
    window.addEventListener('devicemotion', e => {
      const a = e.accelerationIncludingGravity
      if (!a) return
      const mag = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0)
      const now = Date.now()
      if (mag > 40 && now - last > 1200) {
        last = now
        clinkRef.current()
      }
    })
  }, [])

  // Android and other no-permission devices: listen right away
  useEffect(() => {
    if (IS_TOUCH && typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission !== 'function') {
      attachShake()
    }
  }, [attachShake])

  // iOS: motion needs a user-gesture permission — ask on first clink
  const enableShakeIOS = useCallback(() => {
    if (motionReady.current || !IS_TOUCH) return
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(res => { if (res === 'granted') attachShake() })
        .catch(() => {})
    }
  }, [attachShake])

  const clink = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate([30, 40, 30])
    countRef.current += 1
    setCount(countRef.current)
    setTotal(prev => {
      const next = prev + 1
      try { localStorage.setItem('sher-total', next) } catch { /* private mode */ }
      return next
    })
    setShowInvite(false)
    setTaunt(null)
    enableShakeIOS()
    // rounds get rowdier: more bubbles every clink, capped
    spawnBubbles(Math.min(26 + countRef.current * 4, 50))
    if (countRef.current % 5 === 0) {
      playFlourish()
      spawnBeerRain()
    } else {
      playClink()
    }
    setCheering(true)
  }, [playClink, playFlourish, spawnBubbles, spawnBeerRain, enableShakeIOS])

  // hold the lion for a moment → it roars
  const startRoarHold = useCallback(() => {
    clearTimeout(roarTimer.current)
    roarTimer.current = setTimeout(() => {
      playRoar()
      if (navigator.vibrate) navigator.vibrate([60, 40, 120])
      spawnBubbles(18)
      setRoaring(true)
      clearTimeout(roarEndTimer.current)
      roarEndTimer.current = setTimeout(() => setRoaring(false), 850)
    }, 550)
  }, [playRoar, spawnBubbles])

  const cancelRoarHold = useCallback(() => {
    clearTimeout(roarTimer.current)
  }, [])

  useEffect(() => { clinkRef.current = clink }, [clink])

  // idle taunts: gone quiet after clinking? the lion notices
  useEffect(() => {
    if (cheering || count === 0) return
    const id = setTimeout(() => {
      setTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)])
    }, 15000)
    return () => clearTimeout(id)
  }, [cheering, count])

  const flipCoin = useCallback(() => {
    setBuying('flipping')
    setFlipLine(0)
    flipCycle.current = setInterval(() => setFlipLine(i => i + 1), 500)
    flipTimer.current = setTimeout(() => {
      clearInterval(flipCycle.current)
      setBuying(Math.random() < 0.5 ? 'You’re buying! 💸' : 'They’re buying! 🎉')
    }, 2000)
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
    clearInterval(flipCycle.current)
    playPour()
    setBuying(null)
    setShare('idle')
    setCheering(false)
  }, [playPour])

  const msg =
    count >= 10
      ? { title: 'Bas Vi Karo Veere!', line: '10 rounds?! Even the lion is calling it a night. 😅😴' }
      : CHEERS[Math.min(Math.max(count - 1, 0), CHEERS.length - 1)]

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
          <div
            className={`mascot${roaring ? ' roaring' : ''}`}
            onPointerDown={startRoarHold}
            onPointerUp={cancelRoarHold}
            onPointerLeave={cancelRoarHold}
            onContextMenu={e => e.preventDefault()}
          >
            🦁
          </div>
        </div>

        {showInvite ? (
          <p className="challenge">
            🍻 <strong>{INVITE.from || 'A yaar'}</strong> clinked{' '}
            {INVITE.n} round{INVITE.n === 1 ? '' : 's'} &amp; sent it to you — clink back!
          </p>
        ) : taunt ? (
          <p className="tagline taunt">{taunt}</p>
        ) : (
          <p className="tagline">The lion doesn&rsquo;t drink alone. Show this. Share a beer.</p>
        )}

        <button className="mug-btn" onClick={clink}>
          <span className="sheen" aria-hidden="true" />
          <span className="clink">🍺</span> {showInvite ? 'Clink back' : 'Cheers, yaar'}
        </button>
        <div className="hint">{canShake ? 'tap or shake to clink' : 'tap to clink'}</div>
      </main>

      <footer className="credit">
        Designed by{' '}
        <a href="https://portfoliohehe.netlify.app/" target="_blank" rel="noopener noreferrer">
          Saranjit Thind
        </a>
      </footer>

      <section className={`cheers${cheering ? ' show' : ''}`}>
        <div className="clink-big" key={count}>🍻</div>
        <div className="h2-wrap"><h2>{msg.title}</h2></div>
        <div className="ornament" aria-hidden="true">
          <span className="rule" /><span className="gem">✦</span><span className="rule" />
        </div>
        <p>{msg.line}</p>
        <div className="count-chip">
          🍺 &times; {count} tonight{total > count ? <> &middot; {total} all time</> : null}
        </div>

        <div className="buying">
          {buying === null && (
            <button className="coin-btn" onClick={flipCoin}>
              Who&rsquo;s buying? 🪙
            </button>
          )}
          {buying === 'flipping' && (
            <div className="flip-wrap">
              <div className="coin-spin" aria-label="flipping a coin">🪙</div>
              <div className="flip-line">{FLIP_LINES[flipLine % FLIP_LINES.length]}</div>
            </div>
          )}
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
