'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type LocalProgressArgs = {
  storageKey: string
  initialValues?: Record<string, unknown>
  schemaMeta?: Record<string, unknown>
}

type LocalProgressResult = {
  restoredValues: Record<string, unknown> | null
  saveProgress: (values: Record<string, unknown>) => void
  clearProgress: () => void
  isHydrated: boolean
}

type StoredProgress = {
  values: Record<string, unknown>
  meta?: Record<string, unknown>
  updatedAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function shouldDiscardStoredMeta(
  storedMeta: Record<string, unknown> | undefined,
  currentMeta: Record<string, unknown> | undefined,
): boolean {
  if (!storedMeta || !currentMeta) {
    return false
  }
  const versionKey = 'templateVersionId'
  if (
    versionKey in storedMeta &&
    versionKey in currentMeta &&
    storedMeta[versionKey] !== currentMeta[versionKey]
  ) {
    return true
  }
  return false
}

export function useLocalProgress({
  storageKey,
  initialValues,
  schemaMeta,
}: LocalProgressArgs): LocalProgressResult {
  const [restoredValues, setRestoredValues] = useState<Record<string, unknown> | null>(
    null,
  )
  const [isHydrated, setIsHydrated] = useState(false)
  const latestValuesRef = useRef<Record<string, unknown> | null>(initialValues ?? null)

  const baseValues = useMemo(
    () => ({ ...(initialValues ?? {}) }),
    [initialValues],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) {
        setRestoredValues(baseValues)
        setIsHydrated(true)
        return
      }
      const parsed = JSON.parse(raw) as StoredProgress
      if (
        !isRecord(parsed) ||
        !isRecord(parsed.values) ||
        shouldDiscardStoredMeta(
          isRecord(parsed.meta) ? parsed.meta : undefined,
          schemaMeta,
        )
      ) {
        setRestoredValues(baseValues)
        setIsHydrated(true)
        return
      }

      const merged = { ...baseValues, ...parsed.values }
      latestValuesRef.current = merged
      setRestoredValues(merged)
    } catch (error) {
      console.error('Impossibile recuperare i progressi locali', error)
      setRestoredValues(baseValues)
    } finally {
      setIsHydrated(true)
    }
  }, [baseValues, schemaMeta, storageKey])

  const saveProgress = useCallback(
    (values: Record<string, unknown>) => {
      if (typeof window === 'undefined') {
        return
      }
      latestValuesRef.current = values
      const payload: StoredProgress = {
        values,
        meta: schemaMeta,
        updatedAt: new Date().toISOString(),
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
        setRestoredValues(values)
      } catch (error) {
        console.error('Impossibile salvare i progressi locali', error)
      }
    },
    [schemaMeta, storageKey],
  )

  const clearProgress = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    window.localStorage.removeItem(storageKey)
    latestValuesRef.current = initialValues ?? null
    setRestoredValues(initialValues ?? {})
  }, [initialValues, storageKey])

  return {
    restoredValues,
    saveProgress,
    clearProgress,
    isHydrated,
  }
}
