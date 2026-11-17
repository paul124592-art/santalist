import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES, TOYS, daysUntilChristmas } from './data/toys'

const LS_PICKS = 'santalist:picks'
const LS_NAME = 'santalist:name'
const LS_AGE = 'santalist:age'
const LS_THEME = 'santalist:theme'
// Premium is verified server-side by the Supabase "premium" edge function.
// The token stored here is the Stripe checkout session id — it only unlocks
// Premium while the server confirms it was paid. This flag alone never
// grants Premium: on every load the token is re-checked with the server.
const LS_TOKEN = 'santalist_premium_token'

// SantaList Premium is a $2.99 one-time unlock (no subscription).
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/bJe28qes64Cq95SgLa4Ja02'
const PREMIUM_PRICE = '$2.99'
const FREE_CUSTOM_WISHES = 3

const THEMES = [
  { id: 'classic', name: 'Classic Red', emoji: '🎅', premium: false, letter: 'bg-santa-cream text-gray-800', heading: 'text-santa-red' },
  { id: 'winter', name: 'Winter Wonderland', emoji: '❄️', premium: true, letter: 'bg-sky-100 text-sky-950', heading: 'text-sky-800' },
  { id: 'gold', name: 'Gold & Green', emoji: '✨', premium: true, letter: 'bg-amber-50 text-emerald-950', heading: 'text-emerald-800' },
  { id: 'night', name: 'Snowy Night', emoji: '🌙', premium: true, letter: 'bg-slate-900 text-slate-100', heading: 'text-amber-300' },
]

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function Snowfall() {
  const flakes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 9 + Math.random() * 10,
        size: 12 + Math.random() * 18,
        char: ['❄', '❅', '❆'][i % 3],
      })),
    []
  )
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {flakes.map((f) => (
        <span
          key={f.id}
          className="snowflake absolute text-white/80"
          style={{
            left: `${f.left}%`,
            fontSize: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const [picks, setPicks] = useState(() => load(LS_PICKS, []))
  const [kidName, setKidName] = useState(() => load(LS_NAME, ''))
  const [kidAge, setKidAge] = useState(() => load(LS_AGE, ''))
  const [category, setCategory] = useState('all')
  const [customWish, setCustomWish] = useState('')
  const [toast, setToast] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [letterTheme, setLetterTheme] = useState(() => load(LS_THEME, 'classic'))
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [checkingPremium, setCheckingPremium] = useState(false)

  useEffect(() => localStorage.setItem(LS_PICKS, JSON.stringify(picks)), [picks])
  useEffect(() => localStorage.setItem(LS_NAME, JSON.stringify(kidName)), [kidName])
  useEffect(() => localStorage.setItem(LS_AGE, JSON.stringify(kidAge)), [kidAge])
  useEffect(() => localStorage.setItem(LS_THEME, JSON.stringify(letterTheme)), [letterTheme])

  // Verify Premium with the Supabase backend on every load.
  // 1. If we just came back from Stripe (?session_id=...), verify that
  //    session with the server. On success the session id becomes our token.
  // 2. Otherwise re-check any stored token with the server.
  // Premium is on ONLY while the server says so. If the Supabase settings
  // are missing, or the check fails, Premium stays locked (fail closed).
  useEffect(() => {
    async function verifyPremium() {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      // Clean up the old v1 flag so a free unlock from before can never linger.
      try {
        localStorage.removeItem('santalist:premium')
      } catch {
        // ignore
      }
      if (!supabaseUrl || !anonKey) return
      setCheckingPremium(true)
      try {
        const endpoint = `${String(supabaseUrl).replace(/\/$/, '')}/functions/v1/premium`
        const headers = {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        }
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')
        if (sessionId) {
          // Strip session_id from the URL so a refresh does not re-verify.
          const next = new URL(window.location.href)
          next.searchParams.delete('session_id')
          window.history.replaceState({}, '', next.toString())
          const res = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'verify', session_id: sessionId }),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data && data.premium) {
            localStorage.setItem(LS_TOKEN, sessionId)
            setIsPremium(true)
            showToast('Welcome to Premium! ⭐ Enjoy the extra designs!')
            return
          }
        }
        const token = localStorage.getItem(LS_TOKEN)
        if (!token) {
          setIsPremium(false)
          return
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'check', token }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data && data.premium) {
          setIsPremium(true)
        } else {
          localStorage.removeItem(LS_TOKEN)
          setIsPremium(false)
        }
      } catch {
        // Network/server failure: fail closed, Premium stays off.
        setIsPremium(false)
      } finally {
        setCheckingPremium(false)
      }
    }
    verifyPremium()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const theme = THEMES.find((t) => t.id === letterTheme) || THEMES[0]
  const customWishCount = picks.filter((p) => p.toyId === null).length

  const daysLeft = daysUntilChristmas()
  const shownToys = category === 'all' ? TOYS : TOYS.filter((t) => t.category === category)
  const favorite = picks.find((p) => p.favorite)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function addToy(toy) {
    if (picks.some((p) => p.toyId === toy.id)) {
      showToast(`${toy.name} is already on your list!`)
      return
    }
    setPicks((prev) => [...prev, { key: `${toy.id}-${Date.now()}`, toyId: toy.id, name: toy.name, emoji: toy.emoji, favorite: false }])
  }

  function addCustomWish() {
    const name = customWish.trim()
    if (!name) return
    if (!isPremium && customWishCount >= FREE_CUSTOM_WISHES) {
      setShowUpgrade(true)
      return
    }
    setPicks((prev) => [...prev, { key: `custom-${Date.now()}`, toyId: null, name, emoji: '🎁', favorite: false }])
    setCustomWish('')
    showToast('Wish added!')
  }

  function pickTheme(t) {
    if (t.premium && !isPremium) {
      setShowUpgrade(true)
      return
    }
    setLetterTheme(t.id)
  }

  function removePick(key) {
    setPicks((prev) => prev.filter((p) => p.key !== key))
  }

  function movePick(key, dir) {
    setPicks((prev) => {
      const i = prev.findIndex((p) => p.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const copy = [...prev]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  function starPick(key) {
    setPicks((prev) => prev.map((p) => ({ ...p, favorite: p.key === key ? !p.favorite : false })))
  }

  function clearList() {
    if (picks.length === 0) return
    if (window.confirm('Start a brand new list? This clears everything on it.')) setPicks([])
  }

  function listText() {
    const lines = picks.map((p, i) => `${i + 1}. ${p.name}${p.favorite ? ' ⭐ (my #1 wish!)' : ''}`)
    return `🎅 ${kidName ? `${kidName}'s` : 'My'} Christmas Wish List 🎄\n\n${lines.join('\n')}\n\nMade with SantaList`
  }

  async function copyList() {
    if (picks.length === 0) {
      showToast('Add some toys first!')
      return
    }
    try {
      await navigator.clipboard.writeText(listText())
      showToast('List copied! Paste it anywhere.')
    } catch {
      showToast('Copy did not work — try printing instead!')
    }
  }

  function printLetter() {
    if (picks.length === 0) {
      showToast('Add some toys first!')
      return
    }
    window.print()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-santa-darkred via-santa-red to-[#7f1d1d] font-body text-white">
      <Snowfall />

      <div className="relative mx-auto max-w-6xl px-4 pb-16">
        {/* Header */}
        <header className="no-print pt-8 text-center">
          <img src="/logo-mark.png" alt="Letters to Santa logo" className="mx-auto h-28 w-28 rounded-full object-cover shadow-lg" />
          <h1 className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl">SantaList</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-red-100">
            Pick your favorite toys from the pictures, make your very own Christmas wish list, and print a letter to Santa!
          </p>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-lg font-bold backdrop-blur">
            🎄 {daysLeft === 0 ? "It's Christmas Day!" : daysLeft === 1 ? 'Only 1 day until Christmas!' : `${daysLeft} days until Christmas!`}
          </div>
        </header>

        {/* Who is it for */}
        <section className="no-print mx-auto mt-8 max-w-2xl rounded-3xl bg-white p-5 text-gray-800 shadow-xl">
          <h2 className="font-display text-xl font-semibold">Who is this list for?</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-bold text-gray-500">Your name</span>
              <input
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                placeholder="e.g. Mia"
                maxLength={30}
                className="mt-1 w-full rounded-xl border-2 border-red-200 px-3 py-2 text-lg font-bold outline-none focus:border-santa-red"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-gray-500">Your age</span>
              <input
                value={kidAge}
                onChange={(e) => setKidAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                placeholder="e.g. 7"
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border-2 border-red-200 px-3 py-2 text-lg font-bold outline-none focus:border-santa-red"
              />
            </label>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Your list is saved only on this device — nothing is sent anywhere. 🔒
          </p>
        </section>

        {/* Toy picker + list */}
        <main className="no-print mt-8 grid gap-6 lg:grid-cols-5">
          {/* Toy grid */}
          <section className="lg:col-span-3">
            <h2 className="font-display text-2xl font-semibold">🧸 Pick your toys</h2>
            <p className="mt-1 text-red-100">Tap a picture to add it to your list.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    category === c.id
                      ? 'bg-santa-gold text-red-900 shadow'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {shownToys.map((toy) => {
                const added = picks.some((p) => p.toyId === toy.id)
                return (
                  <button
                    key={toy.id}
                    onClick={() => addToy(toy)}
                    className={`relative flex flex-col items-center rounded-2xl bg-white p-3 text-gray-800 shadow transition hover:-translate-y-0.5 hover:shadow-xl ${
                      added ? 'ring-4 ring-santa-gold' : ''
                    }`}
                  >
                    <span className="text-5xl leading-none">{toy.emoji}</span>
                    <span className="mt-2 text-center text-sm font-bold leading-tight">{toy.name}</span>
                    {added && (
                      <span className="absolute -right-1 -top-1 rounded-full bg-santa-green px-2 py-1 text-xs font-bold text-white shadow">
                        ✓ Added
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Custom wish */}
            <div className="mt-6 rounded-3xl bg-white p-5 text-gray-800 shadow-xl">
              <h3 className="font-display text-lg font-semibold">✨ Wish for something else?</h3>
              <p className="text-sm text-gray-500">
                Type any toy or wish that isn't in the pictures.{' '}
                {!isPremium && `Free: ${FREE_CUSTOM_WISHES} custom wishes (you've used ${customWishCount}).`}
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  value={customWish}
                  onChange={(e) => setCustomWish(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomWish()}
                  placeholder="e.g. A blue bike"
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-xl border-2 border-red-200 px-3 py-2 font-bold outline-none focus:border-santa-red"
                />
                <button
                  onClick={addCustomWish}
                  className="shrink-0 rounded-xl bg-santa-red px-4 py-2 font-bold text-white hover:bg-santa-darkred"
                >
                  Add wish
                </button>
              </div>
            </div>
          </section>

          {/* My list */}
          <section className="lg:col-span-2">
            <div className="sticky top-4 rounded-3xl bg-white p-5 text-gray-800 shadow-xl">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">🎄 My Wish List</h2>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-santa-red">
                  {picks.length} {picks.length === 1 ? 'wish' : 'wishes'}
                </span>
              </div>

              {picks.length === 0 ? (
                <p className="mt-4 rounded-2xl bg-red-50 p-4 text-center font-bold text-gray-500">
                  Your list is empty! Tap some toys to add them. 🎁
                </p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {picks.map((p, i) => (
                    <li key={p.key} className="flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2">
                      <span className="text-3xl">{p.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold">
                          {i + 1}. {p.name}
                        </span>
                        {p.favorite && <span className="text-xs font-bold text-santa-gold">⭐ My #1 wish!</span>}
                      </span>
                      <span className="flex shrink-0 flex-col">
                        <button onClick={() => movePick(p.key, -1)} disabled={i === 0} className="px-1 text-gray-400 disabled:opacity-30" title="Move up">▲</button>
                        <button onClick={() => movePick(p.key, 1)} disabled={i === picks.length - 1} className="px-1 text-gray-400 disabled:opacity-30" title="Move down">▼</button>
                      </span>
                      <button onClick={() => starPick(p.key)} className="shrink-0 text-xl" title="Make this my #1 wish">
                        {p.favorite ? '⭐' : '☆'}
                      </button>
                      <button onClick={() => removePick(p.key)} className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-sm font-bold text-santa-red" title="Remove">
                        ✕
                      </button>
                    </li>
                  ))}
                </ol>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={printLetter}
                  className="rounded-xl bg-santa-green px-3 py-3 font-display font-semibold text-white shadow hover:brightness-110"
                >
                  🖨️ Print my letter
                </button>
                <button
                  onClick={copyList}
                  className="rounded-xl bg-santa-gold px-3 py-3 font-display font-semibold text-red-900 shadow hover:brightness-110"
                >
                  📋 Copy my list
                </button>
              </div>
              <button onClick={clearList} className="mt-2 w-full rounded-xl py-2 text-sm font-bold text-gray-400 hover:text-santa-red">
                Start a brand new list
              </button>
              {!isPremium ? (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="mt-3 w-full rounded-xl bg-santa-red px-3 py-3 font-display font-semibold text-white shadow hover:bg-santa-darkred"
                >
                  ✨ Get Premium — {PREMIUM_PRICE} once
                </button>
              ) : (
                <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-center text-sm font-bold text-yellow-700">
                  ⭐ You're Premium! Extra letter designs, unlimited wishes &amp; the Nice List certificate are yours.
                </p>
              )}
              {favorite && (
                <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-center text-sm font-bold text-yellow-700">
                  ⭐ Your #1 wish is the {favorite.name}! Santa will notice!
                </p>
              )}
            </div>
          </section>
        </main>

        {/* Letter preview */}
        {picks.length > 0 && (
          <section className="mt-8">
            <h2 className="no-print font-display text-2xl font-semibold">✉️ Your letter to Santa</h2>
            <p className="no-print mt-1 text-red-100">This is what prints out. Show it to a grown-up!</p>

            {/* Letter design picker */}
            <div className="no-print mx-auto mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => pickTheme(t)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    letterTheme === t.id
                      ? 'bg-santa-gold text-red-900 shadow'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {t.emoji} {t.name}
                  {t.premium && !isPremium ? ' 🔒' : ''}
                </button>
              ))}
            </div>

            <div
              id="santa-letter"
              className={`mx-auto mt-4 max-w-2xl rounded-3xl ${theme.letter} p-8 shadow-2xl`}
            >
              <div className={`text-center font-display text-3xl font-bold ${theme.heading}`}>Dear Santa, 🎅</div>
              <p className="mt-4 text-lg leading-relaxed">
                My name is <strong>{kidName || '____________'}</strong>
                {kidAge ? ` and I am ${kidAge} years old` : ''}. I have been very good this year!
                Here are the things I would love most for Christmas:
              </p>
              <ol className="mt-4 space-y-1 text-lg">
                {picks.map((p, i) => (
                  <li key={p.key} className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span>
                      {i + 1}. {p.name}
                      {p.favorite && <strong className="text-santa-red"> ⭐ (my #1 wish!)</strong>}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-lg leading-relaxed">
                Thank you Santa, and Merry Christmas! I will leave you cookies and milk. 🍪🥛
              </p>
              <p className="mt-6 text-right font-display text-xl font-semibold">
                Love, {kidName || '____________'} ❤️
              </p>
              <p className="mt-6 text-center text-xs text-gray-400">Made with SantaList 🎄</p>
            </div>

            {/* Nice List certificate — Premium */}
            {isPremium ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-3xl border-4 border-dashed border-santa-gold bg-white p-8 text-center text-gray-800 shadow-2xl">
                <div className="text-5xl">🏅</div>
                <div className="mt-2 font-display text-3xl font-bold text-santa-red">Official Nice List Certificate</div>
                <p className="mt-3 text-lg">
                  This certifies that <strong>{kidName || '____________'}</strong> is officially on Santa's Nice List this Christmas! 🎄
                </p>
                <p className="mt-2 text-sm text-gray-500">Signed, Santa Claus 🎅 — North Pole</p>
              </div>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="no-print mx-auto mt-6 block max-w-2xl rounded-3xl border-4 border-dashed border-white/40 bg-white/10 p-6 text-center text-white backdrop-blur hover:bg-white/20"
              >
                <div className="text-4xl">🏅 🔒</div>
                <div className="mt-2 font-display text-xl font-semibold">Nice List Certificate — Premium</div>
                <p className="mt-1 text-sm text-red-100">Unlock a printable certificate that says your child is officially on Santa's Nice List!</p>
              </button>
            )}
          </section>
        )}

        {/* FAQ */}
        <section className="no-print mx-auto mt-12 max-w-3xl">
          <h2 className="text-center font-display text-2xl font-semibold">Questions? 🎄</h2>
          <div className="mt-4 space-y-3">
            {[
              ['Is SantaList free?', 'Yes! Picking toys, making your list, and printing your letter to Santa are all free. Premium is a one-time $2.99 that adds extra letter designs, unlimited custom wishes, and a Nice List certificate.'],
              ['Is my child\u2019s information safe?', 'Yes. Lists are saved only on this device in your browser. Nothing is sent to the internet, and no account is needed.'],
              ['How do I print the letter?', 'Tap "Print my letter" and your printer will print just the letter — not the toy pictures. You can also save it as a PDF from the print screen.'],
              ['When should we send the letter to Santa?', 'Early December is best, so Santa and his elves have plenty of time!'],
            ].map(([q, a]) => (
              <details key={q} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <summary className="cursor-pointer font-display font-semibold">{q}</summary>
                <p className="mt-2 text-red-100">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="no-print mt-12 text-center text-sm text-red-200">
          SantaList 🎅 — Made with love for Christmas. Your list stays on your device.
        </footer>
      </div>

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-5 py-3 font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}

      {/* Premium upgrade modal */}
      {showUpgrade && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center text-gray-800 shadow-2xl">
            <div className="text-5xl">⭐</div>
            <h3 className="mt-2 font-display text-2xl font-bold text-santa-red">SantaList Premium</h3>
            <p className="mt-1 text-lg font-bold">{PREMIUM_PRICE} — one time, no subscription</p>
            <ul className="mt-4 space-y-2 text-left">
              <li>🎨 3 extra festive letter designs</li>
              <li>✨ Unlimited custom wishes</li>
              <li>🏅 Printable Nice List certificate</li>
            </ul>
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-5 block rounded-xl bg-santa-green px-4 py-3 font-display font-semibold text-white shadow hover:brightness-110"
            >
              Get Premium — {PREMIUM_PRICE}
            </a>
            <p className="mt-3 text-sm font-bold text-gray-500">
              {checkingPremium
                ? 'Checking your payment… ✨'
                : 'After paying, you\u2019ll come straight back here and Premium unlocks automatically. ✨'}
            </p>
            <button onClick={() => setShowUpgrade(false)} className="mt-2 w-full py-2 text-sm font-bold text-gray-400">
              Not right now
            </button>
            <p className="mt-2 text-xs text-gray-400">A grown-up pays with a card. One payment, yours forever.</p>
          </div>
        </div>
      )}
    </div>
  )
}
