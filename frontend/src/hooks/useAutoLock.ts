import { useState, useEffect, useCallback, useRef } from 'react'

const LOCK_TIMEOUT_MS = 5 * 60 * 1000 // 5分

export function useAutoLock(enabled: boolean) {
  const [isLocked, setIsLocked] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLockedRef = useRef(false)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIsLocked(true)
      isLockedRef.current = true
    }, LOCK_TIMEOUT_MS)
  }, [])

  const unlock = useCallback(() => {
    setIsLocked(false)
    isLockedRef.current = false
    resetTimer()
  }, [resetTimer])

  useEffect(() => {
    if (!enabled) return

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'touchmove', 'click']

    const handleActivity = () => {
      if (!isLockedRef.current) {
        resetTimer()
      }
    }

    events.forEach((e) => document.addEventListener(e, handleActivity, { passive: true, capture: true }))
    resetTimer()

    return () => {
      events.forEach((e) => document.removeEventListener(e, handleActivity, true))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [enabled, resetTimer])

  return { isLocked, unlock }
}
