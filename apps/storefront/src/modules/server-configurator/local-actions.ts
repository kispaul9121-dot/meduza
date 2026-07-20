"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type CartItem = { id: string; quantity: number }
type Collections = {
  favorites: string[]
  compare: string[]
  cart: CartItem[]
  quoteRequests: string[]
}

const STORAGE_KEY = "payloudProductCollections"
const EMPTY_COLLECTIONS: Collections = {
  favorites: [],
  compare: [],
  cart: [],
  quoteRequests: [],
}
const UPDATE_EVENT = "payloud-product-collections:update"
export const MAX_COMPARE_ITEMS = 4

function normalizeCollections(value: unknown): Collections {
  const candidate = value && typeof value === "object"
    ? value as Partial<Record<keyof Collections, unknown>>
    : {}
  return {
    favorites: Array.isArray(candidate.favorites)
      ? Array.from(new Set(candidate.favorites.filter((id): id is string => typeof id === "string")))
      : [],
    compare: Array.isArray(candidate.compare)
      ? Array.from(new Set(candidate.compare.filter((id): id is string => typeof id === "string"))).slice(0, MAX_COMPARE_ITEMS)
      : [],
    cart: Array.isArray(candidate.cart)
      ? candidate.cart.filter((item): item is CartItem => Boolean(
        item && typeof item === "object" &&
        typeof (item as CartItem).id === "string" &&
        typeof (item as CartItem).quantity === "number"
      ))
      : [],
    quoteRequests: Array.isArray(candidate.quoteRequests)
      ? candidate.quoteRequests.filter((id): id is string => typeof id === "string")
      : [],
  }
}

function readCollections() {
  if (typeof window === "undefined") return EMPTY_COLLECTIONS
  try {
    return normalizeCollections(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null"))
  } catch {
    return EMPTY_COLLECTIONS
  }
}

function writeCollections(collections: Collections) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: collections }))
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

function addCartItem(cart: CartItem[], id: string) {
  const existing = cart.find((item) => item.id === id)
  if (existing) {
    return cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)
  }
  return [...cart, { id, quantity: 1 }]
}

function setCartItemQuantity(cart: CartItem[], id: string, quantity: number) {
  if (quantity <= 0) return cart.filter((item) => item.id !== id)
  return cart.map((item) => item.id === id ? { ...item, quantity } : item)
}

export function useServerLocalActions(productId?: string) {
  const [collections, setCollections] = useState<Collections>(EMPTY_COLLECTIONS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCollections(readCollections())
    setHydrated(true)
    const onUpdate = () => setCollections(readCollections())
    window.addEventListener(UPDATE_EVENT, onUpdate)
    window.addEventListener("storage", onUpdate)
    return () => {
      window.removeEventListener(UPDATE_EVENT, onUpdate)
      window.removeEventListener("storage", onUpdate)
    }
  }, [])

  const update = useCallback((recipe: (current: Collections) => Collections) => {
    const next = recipe(readCollections())
    writeCollections(next)
    setCollections(next)
  }, [])

  const toggleFavorite = useCallback((id = productId) => {
    if (!id) return
    update((current) => ({ ...current, favorites: toggleId(current.favorites, id) }))
  }, [productId, update])

  const toggleCompare = useCallback((id = productId) => {
    if (!id) return
    update((current) => ({
      ...current,
      compare: current.compare.includes(id)
        ? current.compare.filter((item) => item !== id)
        : [...current.compare, id].slice(-MAX_COMPARE_ITEMS),
    }))
  }, [productId, update])

  const replaceCompare = useCallback((ids: string[]) => {
    update((current) => ({ ...current, compare: Array.from(new Set(ids)).slice(0, MAX_COMPARE_ITEMS) }))
  }, [update])

  const addToCart = useCallback((id = productId) => {
    if (!id) return
    update((current) => ({ ...current, cart: addCartItem(current.cart, id) }))
  }, [productId, update])

  const setCartQuantity = useCallback((id: string, quantity: number) => {
    update((current) => ({ ...current, cart: setCartItemQuantity(current.cart, id, quantity) }))
  }, [update])

  const removeFromCart = useCallback((id: string) => {
    update((current) => ({ ...current, cart: current.cart.filter((item) => item.id !== id) }))
  }, [update])

  const clearCart = useCallback(() => {
    update((current) => ({ ...current, cart: [] }))
  }, [update])

  const removeFavorite = useCallback((id: string) => {
    update((current) => ({ ...current, favorites: current.favorites.filter((item) => item !== id) }))
  }, [update])

  const removeCompare = useCallback((id: string) => {
    update((current) => ({ ...current, compare: current.compare.filter((item) => item !== id) }))
  }, [update])

  const requestQuote = useCallback((id = productId) => {
    if (!id) return
    update((current) => ({
      ...current,
      quoteRequests: current.quoteRequests.includes(id) ? current.quoteRequests : [...current.quoteRequests, id],
    }))
  }, [productId, update])

  const counters = useMemo(() => ({
    favorites: collections.favorites.length,
    compare: collections.compare.length,
    cart: collections.cart.reduce((sum, item) => sum + item.quantity, 0),
    quoteRequests: collections.quoteRequests.length,
  }), [collections])

  return {
    collections,
    hydrated,
    counters,
    isFavorite: Boolean(productId && collections.favorites.includes(productId)),
    isCompared: Boolean(productId && collections.compare.includes(productId)),
    toggleFavorite,
    toggleCompare,
    addToCart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    removeFavorite,
    removeCompare,
    replaceCompare,
    requestQuote,
  }
}
