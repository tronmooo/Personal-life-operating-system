'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiProps {
  trigger?: boolean
  type?: 'success' | 'achievement' | 'goal' | 'celebration'
}

export function Confetti({ trigger, type = 'success' }: ConfettiProps) {
  useEffect(() => {
    if (!trigger) return

    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      if (type === 'achievement') {
        // Gold trophy explosion
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF8C00']
        })
      } else if (type === 'goal') {
        // Target hit effect
        confetti({
          ...defaults,
          particleCount,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#10b981', '#34d399', '#6ee7b7']
        })
      } else if (type === 'celebration') {
        // Full screen celebration
        confetti({
          ...defaults,
          particleCount: particleCount * 2,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#f43f5e', '#f59e0b']
        })
      } else {
        // Success confetti
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        })
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        })
      }
    }, 250)

    return () => clearInterval(interval)
  }, [trigger, type])

  return null
}

export function fireConfetti(type: 'success' | 'achievement' | 'goal' | 'celebration' = 'success') {
  const duration = 3000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    if (type === 'achievement') {
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF8C00']
      })
    } else if (type === 'goal') {
      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      })
    } else if (type === 'celebration') {
      confetti({
        ...defaults,
        particleCount: particleCount * 2,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#a855f7', '#ec4899', '#f43f5e', '#f59e0b']
      })
    } else {
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }
  }, 250)
}








