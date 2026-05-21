import { useEffect, useRef, useCallback } from 'react'

export function useSSE(onEvent) {
  const esRef = useRef(null)
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    const token = localStorage.getItem('bl_token')
    if (!token) return

    const es = new EventSource(`/api/events?token=${token}`)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type !== 'connected') onEventRef.current(data)
      } catch {}
    }

    es.onerror = () => {
      es.close()
      // Reconnect after 5s
      setTimeout(connect, 5000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => esRef.current?.close()
  }, [connect])
}
