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
  if (!(storedMeta && currentMeta)) {
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

function parseStoredProgress(
  raw: string,
  baseValues: Record<string, unknown>,
  schemaMeta: Record<string, unknown> | undefined,
): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as StoredProgress
    if (
      !(isRecord(parsed) && isRecord(parsed.values)) ||
      shouldDiscardStoredMeta(
        isRecord(parsed.meta) ? parsed.meta : undefined,
        schemaMeta,
      )
    ) {
      return null
    }
    return { ...baseValues, ...parsed.values }
  } catch {
    return null
  }
}

function restoreFromStorage(
  storageKey: string,
  baseValues: Record<string, unknown>,
  schemaMeta: Record<string, unknown> | undefined,
): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return baseValues
    }
    const merged = parseStoredProgress(raw, baseValues, schemaMeta)
    return merged ?? baseValues
  } catch (error) {
    console.error('Impossibile recuperare i progressi locali', error)
    return baseValues
  }
}

export function useLocalProgress({
  storageKey,
  initialValues,
  schemaMeta,
}: LocalProgressArgs): LocalProgressResult {
  const [restoredValues, setRestoredValues] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const latestValuesRef = useRef<Record<string, unknown> | null>(
    initialValues ?? null,
  )

  const baseValues = useMemo(
    () => ({ ...(initialValues ?? {}) }),
    [initialValues],
  )

  const previousBaseValuesRef = useRef<string>('')
  const previousSchemaMetaRef = useRef<string>('')
  const previousStorageKeyRef = useRef<string>('')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const baseValuesString = JSON.stringify(baseValues)
    const schemaMetaString = JSON.stringify(schemaMeta)
    const hasBaseValuesChanged =
      previousBaseValuesRef.current !== baseValuesString
    const hasSchemaMetaChanged =
      previousSchemaMetaRef.current !== schemaMetaString
    const hasStorageKeyChanged = previousStorageKeyRef.current !== storageKey

    if (
      !(hasBaseValuesChanged || hasSchemaMetaChanged || hasStorageKeyChanged)
    ) {
      return
    }

    previousBaseValuesRef.current = baseValuesString
    previousSchemaMetaRef.current = schemaMetaString
    previousStorageKeyRef.current = storageKey

    const restored = restoreFromStorage(storageKey, baseValues, schemaMeta)
    latestValuesRef.current = restored
    setRestoredValues(restored)
    setIsHydrated(true)
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
