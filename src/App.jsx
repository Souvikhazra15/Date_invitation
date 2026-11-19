import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import emailjs from '@emailjs/browser'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Download,
  Heart,
  LoaderCircle,
  MapPin,
  Music,
  Pause,
  Sparkles,
  UtensilsCrossed,
  VolumeX,
} from 'lucide-react'

const initialChoices = {
  date: '2026-11-24',
  time: '18:00',
  plan: 'Surprise date',
  food: 'Brunch',
}

const noMessages = [
  'Are you sure? 🥺',
  'Pakka na? Think again! 👀',
  'Dekh le... itna bhi bura date nahi hoga! 😂',
  'Please yaar, maan ja na! 🥹',
  'Itni easily reject kar dogi? 💔',
  'Last chance... pretty please? 🌷',
]

const plans = [
  'A little surprise!',
  'Café date',
  'Bookstore wander',
  'Movie date',
  'Arcade night',
  'Evening walk',
  'Surprise date',
]

const foods = [
  ['Italian', '🍝'],
  ['Sushi', '🍣'],
  ['Pizza', '🍕'],
  ['Tacos', '🌮'],
  ['Burgers', '🍔'],
  ['Ramen', '🍜'],
  ['Brunch', '🥞'],
  ['Dessert First', '🍰'],
  ['You Pick', '💗'],
]

function Petals() {
  return (
    <div className="petals" aria-hidden="true">
      {Array.from({ length: 24 }, (_, index) => (
        <span
          key={index}
          className="petal"
          style={{
            left: `${(index * 41 + 7) % 100}%`,
            animationDelay: `${(index % 12) * -0.8}s`,
            animationDuration: `${7 + (index % 5)}s`,
            width: `${7 + (index % 4)}px`,
          }}
        />
      ))}
      {Array.from({ length: 10 }, (_, index) => (
        <span
          key={`heart-${index}`}
          className="floating-heart"
          style={{
            left: `${(index * 29 + 11) % 100}%`,
            animationDelay: `${index * -1.1}s`,
            animationDuration: `${9 + (index % 4)}s`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  )
}

function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const [audio] = useState(() => {
    const element = typeof Audio !== 'undefined' ? new Audio('/assets/background-music.mp3') : null
    if (element) element.loop = true
    return element
  })

  const toggle = async () => {
    if (!audio) return
    try {
      if (playing) {
        audio.pause()
        setPlaying(false)
      } else {
        await audio.play()
        setPlaying(true)
      }
    } catch {
      setPlaying(false)
    }
  }

  return (
    <button className="music-player" type="button" onClick={toggle} aria-label={playing ? 'Pause music' : 'Play music'}>
      {playing ? <Pause size={16} /> : <Music size={16} />}
    </button>
  )
}

function Card({ children, className = '' }) {
  return (
    <motion.div
      className={`invitation-card ${className}`}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function HeartConfetti() {
  return (
    <div className="heart-confetti" aria-hidden="true">
      {Array.from({ length: 16 }, (_, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20, x: 0, scale: 0.5 }}
          animate={{
            opacity: [0, 1, 0],
            y: [-20, -150 - (index % 4) * 18],
            x: ((index % 8) - 4) * 18,
            scale: [0.5, 1, 0.8],
            rotate: (index % 2 ? 1 : -1) * (20 + index * 5),
          }}
          transition={{ duration: 1.2, delay: index * 0.025, ease: 'easeOut' }}
        >
          ♥
        </motion.span>
      ))}
    </div>
  )
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(`${value}T12:00:00`)
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

function formatTime(value) {
  if (!value) return ''
  const [hourText, minute] = value.split(':')
  const hour = Number(hourText)
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`
}

function toCalendarStamp(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-')
  const [hour, minute] = timeValue.split(':')
  return `${year}${month}${day}T${hour}${minute}00`
}

function escapeCalendarText(value) {
  return value.replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;').replaceAll('\n', '\\n')
}

export default function App() {
  const [screen, setScreen] = useState(0)
  const [noClicks, setNoClicks] = useState(0)
  const [showYesConfirmation, setShowYesConfirmation] = useState(false)
  const [choices, setChoices] = useState(() => {
    try {
      return { ...initialChoices, ...JSON.parse(localStorage.getItem('dateChoices') || '{}') }
    } catch {
      return initialChoices
    }
  })
  const [error, setError] = useState('')
  const [savedNotice, setSavedNotice] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [emailErrorDetail, setEmailErrorDetail] = useState('')
  const isSending = emailStatus === 'loading'

  useEffect(() => {
    localStorage.setItem('dateChoices', JSON.stringify(choices))
  }, [choices])

  const updateChoice = (key, value) => {
    setChoices((current) => ({ ...current, [key]: value }))
    setError('')
  }

  const goToFood = () => {
    if (!choices.date || !choices.time) {
      setError('Please choose both a date and time.')
      return
    }
    setScreen(2)
  }

  const savePlan = () => {
    if (!choices.date || !choices.time) {
      setError('Please choose both a date and time.')
      return
    }
    localStorage.setItem('dateChoices', JSON.stringify(choices))
    setSavedNotice('Saved!')
    window.setTimeout(() => setSavedNotice(''), 1800)
  }

  const confirmDate = () => {
    if (!choices.food) {
      setError('Please choose a food preference.')
      return
    }
    localStorage.setItem('dateChoices', JSON.stringify(choices))
    setScreen(3)
  }

  const downloadCalendar = () => {
    const start = toCalendarStamp(choices.date, choices.time)
    const startDate = new Date(`${choices.date}T${choices.time}:00`)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
    const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`
    const description = `Plan: ${choices.plan}\\nFood preference: ${choices.food}`
    const calendar = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Little Date//EN',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      'SUMMARY:A little date with me',
      `DESCRIPTION:${escapeCalendarText(description)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'little-date.ics'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const sendDateConfirmation = async () => {
    if (isSending) return

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

    if (!serviceId || !templateId || !publicKey || publicKey === 'your_public_key') {
      setEmailErrorDetail('Email configuration is incomplete.')
      setEmailStatus('error')
      return
    }

    setEmailErrorDetail('')
    setEmailStatus('loading')

    const templateParams = {
      name: 'Your special someone',
      date: formatDate(choices.date),
      time: formatTime(choices.time),
      plan: choices.plan,
      food: choices.food,
    }

    try {
      await emailjs.send(serviceId, templateId, templateParams, { publicKey })
      setEmailStatus('success')
    } catch (sendError) {
      console.error('EmailJS sending error:', sendError)
      const detail =
        sendError?.text ||
        sendError?.message ||
        'The EmailJS service rejected this send request.'
      setEmailErrorDetail(detail)
      setEmailStatus('error')
    }
  }

  const handleNoClick = () => {
    setNoClicks((current) => current + 1)
  }

  const handleYesClick = () => {
    setNoClicks(0)
    setShowYesConfirmation(true)
    window.setTimeout(() => setScreen(1), 1250)
  }

  const positionStage = noClicks === 0 ? 0 : (noClicks - 1) % 6
  const yesScale = 1 + Math.min(noClicks, 6) * 0.055
  const noScale = 1 - Math.min(noClicks, 6) * 0.07
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches
  const noPosition = isMobile
    ? [
        { x: 0, y: 0 },
        { x: 12, y: 0 },
        { x: -12, y: 0 },
        { x: 18, y: 0 },
        { x: -18, y: 0 },
        { x: 14, y: 0 },
      ][positionStage]
    : [
        { x: 0, y: 0 },
        { x: 0, y: -8 },
        { x: 20, y: -16 },
        { x: -20, y: -24 },
        { x: 26, y: -32 },
        { x: -28, y: -38 },
      ][positionStage]

  return (
    <main className="app-shell">
      <Petals />
      <MusicPlayer />
      <AnimatePresence mode="wait">
        {screen === 0 && (
          <Card key="question" className="question-card">
            <div className="top-ribbon">A LITTLE QUESTION</div>
            <h1>Will you go on<br />a date with me?</h1>
            <p className="subtitle">Take your time. I’d really love to spend a day with you.</p>
            <div className="meme-frame">
              <img src="/assets/kitten-meme.png" alt="A cute orange kitten waiting for a yes" />
              <Heart className="meme-heart" size={24} />
            </div>
            <div className="no-message-slot" aria-live="polite">
              <AnimatePresence mode="wait">
                {noClicks > 0 && (
                  <motion.div
                    key={noClicks}
                    className="no-message"
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  >
                    {noClicks % 6 === 0
                      ? 'Okay okay... I get it, you’re thinking REALLY hard! 😂❤️'
                      : noMessages[(noClicks - 1) % 6]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {noClicks > 0 && noClicks % 6 === 0 && (
              <motion.p
                className="final-no-note"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Whenever you’re ready, the invitation is still here. 🌷
              </motion.p>
            )}
            <div className="question-actions">
              {noClicks > 0 && (
                <div className="yes-heart-particles" aria-hidden="true">
                  {Array.from({ length: 4 }, (_, index) => <span key={index}>♥</span>)}
                </div>
              )}
              <motion.button
                className="primary-button yes-growth"
                type="button"
                whileTap={{ scale: 0.97 }}
                animate={{
                  scale: yesScale,
                  boxShadow: noClicks > 0
                    ? `0 ${8 + noClicks * 3}px ${24 + noClicks * 5}px rgba(213, 0, 80, ${0.23 + noClicks * 0.025})`
                    : '0 10px 22px rgba(213, 0, 80, .21)',
                }}
                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                onClick={handleYesClick}
              >
                <Heart size={16} fill="currentColor" /> Yes
              </motion.button>
              <motion.button
                className="secondary-button no-shrink"
                type="button"
                animate={{
                  scale: noScale,
                  x: noPosition.x,
                  y: noPosition.y,
                  fontSize: '7.6px',
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                onClick={handleNoClick}
              >
                No
              </motion.button>
            </div>
            {showYesConfirmation && (
              <motion.div
                className="yes-confirmation"
                role="dialog"
                aria-label="Yes confirmation"
                initial={{ opacity: 0, scale: 0.78, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              >
                <HeartConfetti />
                <strong>YAYYYYY! ❤️</strong>
                <span>Can't wait to spend a beautiful day with you!</span>
              </motion.div>
            )}
          </Card>
        )}

        {screen === 1 && (
          <Card key="planning" className="form-card">
            <div className="step-label">STEP 1 OF 2</div>
            <div className="step-icon"><CalendarDays size={20} /></div>
            <h2>When works for you?</h2>
            <p className="subtitle">Pick a date and time — I’ll make it special.</p>
            <div className="form-fields">
              <label>
                <span>DATE</span>
                <div className="input-wrap">
                  <input type="date" value={choices.date} onChange={(event) => updateChoice('date', event.target.value)} />
                  <CalendarDays size={18} />
                </div>
              </label>
              <label>
                <span>TIME</span>
                <div className="input-wrap">
                  <input type="time" value={choices.time} onChange={(event) => updateChoice('time', event.target.value)} />
                  <Clock3 size={18} />
                </div>
              </label>
              <label>
                <span>THE PLAN</span>
                <div className="input-wrap">
                  <select value={choices.plan} onChange={(event) => updateChoice('plan', event.target.value)}>
                    {plans.map((plan) => <option key={plan}>{plan}</option>)}
                  </select>
                  <MapPin size={18} />
                </div>
              </label>
            </div>
            {error && <p className="validation-error" role="alert">{error}</p>}
            <div className="plan-actions">
              <button className="save-button" type="button" onClick={savePlan}>Save date</button>
              <motion.button className="primary-button wide-button" type="button" whileTap={{ scale: 0.98 }} onClick={goToFood}>
                Next: the food <ArrowRight size={17} />
              </motion.button>
            </div>
            {savedNotice && <motion.p className="saved-notice" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{savedNotice}</motion.p>}
          </Card>
        )}

        {screen === 2 && (
          <Card key="food" className="food-card">
            <div className="step-label">STEP 2 OF 2</div>
            <div className="step-icon"><UtensilsCrossed size={20} /></div>
            <h2>What should we eat?</h2>
            <p className="subtitle">The most important decision of the night. Choose wisely.</p>
            <div className="food-grid" role="radiogroup" aria-label="Food preference">
              {foods.map(([name, emoji]) => (
                <motion.button
                  className={`food-option ${choices.food === name ? 'selected' : ''}`}
                  type="button"
                  role="radio"
                  aria-checked={choices.food === name}
                  key={name}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => updateChoice('food', name)}
                >
                  <span className="food-emoji">{emoji}</span>
                  <span>{name}</span>
                  {choices.food === name && <span className="check-badge"><Check size={11} /></span>}
                </motion.button>
              ))}
            </div>
            <div className="food-actions">
              <button className="back-button" type="button" onClick={() => setScreen(1)}><ArrowLeft size={16} /> Back</button>
              <motion.button className="primary-button wide-button" type="button" whileTap={{ scale: 0.98 }} onClick={confirmDate}>
                It&apos;s a date <Heart size={16} fill="currentColor" />
              </motion.button>
            </div>
          </Card>
        )}

        {screen === 3 && (
          <Card key="confirmation" className="confirmation-card">
            <Sparkles className="confirmation-sparkle" size={28} />
            <h2>It&apos;s a date! 🌹</h2>
            <div className="summary-grid">
              <div><CalendarDays size={18} /><span>{formatDate(choices.date)}</span></div>
              <div><Clock3 size={18} /><span>{formatTime(choices.time)}</span></div>
              <div><MapPin size={18} /><span>{choices.plan}</span></div>
              <div><UtensilsCrossed size={18} /><span>{choices.food}</span></div>
            </div>
            <div className="meme-frame confirmation-meme">
              <img src="/assets/retriever-meme.png" alt="A happy golden retriever celebrating" />
            </div>
            <p className="pickup">I’ll pick you up at {formatTime(choices.time)}. 🚗</p>
            <p className="cant-wait">Can&apos;t wait to see you! 🌷</p>
            <div className="confirmation-actions">
              <button className="change-button" type="button" onClick={() => setScreen(1)}>Change the plan</button>
              <button className="calendar-button" type="button" onClick={downloadCalendar}><Download size={14} /> Add to calendar</button>
            </div>
            <motion.button
              className="send-email-button"
              type="button"
              onClick={sendDateConfirmation}
              disabled={isSending || emailStatus === 'success'}
              whileTap={emailStatus === 'success' ? undefined : { scale: 0.98 }}
            >
              {emailStatus === 'loading' && <LoaderCircle className="sending-spinner" size={16} />}
              {emailStatus === 'loading'
                ? 'Sending your love... 💌'
                : emailStatus === 'success'
                  ? 'Sent with love! ❤️'
                  : emailStatus === 'error'
                    ? 'Try Again 💌'
                    : '💌 Send this to my man'}
            </motion.button>
            {emailStatus === 'success' && (
              <motion.div className="email-success" role="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <strong>Your invitation has reached your man! ❤️</strong>
                <span>Someone just made his day a little more special. 🌷</span>
              </motion.div>
            )}
            {emailStatus === 'error' && (
              <motion.p className="email-error" role="alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Oops! Something went wrong. Please try again.
                {emailErrorDetail && <span className="email-error-detail"> {emailErrorDetail}</span>}
              </motion.p>
            )}
          </Card>
        )}
      </AnimatePresence>
    </main>
  )
}
