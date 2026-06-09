'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Save, Trash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WishlistItem, WishlistType, WishlistSaga } from '@/types'
import { wishlistService } from '@/services/wishlist.service'
import { getCurrencySymbol } from '@/app/terminology/currency'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { editWishlistItemModal } from '@/app/terminology/language/modals/editWishlistItem'
import { addWishlistItemModal } from '@/app/terminology/language/modals/addWishlistItem'
import { common } from '@/app/terminology/language/common'
import { wishlist } from '@/app/terminology/language/wishlist'
import { generateQuarterOptions } from '@/lib/quarters'

interface EditWishlistItemModalProps {
  isOpen: boolean
  onClose: () => void
  item: WishlistItem
  types: WishlistType[]
  sagas: WishlistSaga[]
  onDelete?: (id: number) => void
}

const PRIORITIES = ['low', 'medium', 'high'] as const
const QUARTERS = generateQuarterOptions()

export default function EditWishlistItemModal({
  isOpen, onClose, item, types, sagas, onDelete
}: EditWishlistItemModalProps) {

  const formatPriceForDisplay = (value: number) => {
    if (!value && value !== 0) return ''
    const number = Math.round(value * 100)
    const float = number / 100
    return float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(formatPriceForDisplay(item.price))
  const [checked, setChecked] = useState(item.checked)
  const [priority, setPriority] = useState(item.priority)
  const [quarter, setQuarter] = useState(item.quarter)
  const [typeId, setTypeId] = useState(item.wishlist_type_id?.toString() || '')
  const [sagaId, setSagaId] = useState(item.saga_id?.toString() || '')
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    setName(item.name)
    setPrice(formatPriceForDisplay(item.price))
    setChecked(item.checked)
    setPriority(item.priority)
    setQuarter(item.quarter)
    setTypeId(item.wishlist_type_id?.toString() || '')
    setSagaId(item.saga_id?.toString() || '')
    setShowError(false)
    setConfirmDeleteMode(false)
  }, [item])

  const priorityLabel = (p: string) => {
    if (p === 'low') return t(addWishlistItemModal.low)
    if (p === 'high') return t(addWishlistItemModal.high)
    return t(addWishlistItemModal.medium)
  }

  const quarterLabel = (q: string) => q

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const number = parseInt(raw || '0', 10)

    if (!number) {
      setPrice('')
      return
    }

    const float = number / 100
    setPrice(float.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const cleaned = price.replace(/[^\d.,]/g, '')
      const normalized = cleaned.replace(/\./g, '').replace(',', '.')
      const numericPrice = parseFloat(normalized)

      const data = {
        name,
        price: numericPrice,
        checked,
        priority,
        quarter,
        wishlist_type_id: typeId ? parseInt(typeId) : undefined,
        saga_id: sagaId ? parseInt(sagaId) : undefined,
      }
      await wishlistService.update(item.id, data)
      onClose()
    } catch (error) {
      console.error('Error updating item:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col p-6 overflow-y-auto border-l border-gray-200"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >

            <AnimatePresence>
              {showError && (
                <motion.div
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(editWishlistItemModal.errorUpdating)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {t(editWishlistItemModal.title)}
              </h2>
              <button onClick={onClose} className="text-gray-700 hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(wishlist.name)}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(wishlist.price)}</label>
                <div className="flex items-center rounded-lg overflow-hidden bg-gray-50">
                  <span className="px-3 py-2 font-medium text-gray-600">
                    {getCurrencySymbol(user?.currency)}
                  </span>
                  <input
                    type="text"
                    value={price}
                    onChange={handlePriceChange}
                    className="flex-1 px-3 py-2 outline-none transition bg-transparent text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="itemChecked"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="itemChecked" className="text-sm font-medium text-gray-800">{t(wishlist.checked)}</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(addWishlistItemModal.priority)}</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 outline-none transition bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{priorityLabel(p)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(addWishlistItemModal.quarter)}</label>
                <select
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 outline-none transition bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  {QUARTERS.map(q => (
                    <option key={q} value={q}>{quarterLabel(q)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(wishlist.type)}</label>
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 outline-none transition bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t(addWishlistItemModal.selectType)}</option>
                  {types.map(t => (
                    <option key={t.id} value={t.id.toString()}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(wishlist.saga)}</label>
                <select
                  value={sagaId}
                  onChange={(e) => setSagaId(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 outline-none transition bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t(addWishlistItemModal.selectSaga)}</option>
                  {sagas.map(s => (
                    <option key={s.id} value={s.id.toString()}>{s.name}</option>
                  ))}
                </select>
              </div>

              {!confirmDeleteMode && (
                <button
                  type="submit"
                  className="w-full mt-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {t(common.save)}
                </button>
              )}

              {onDelete && (
                <>
                  {confirmDeleteMode ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMode(false)}
                        className="flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-gray-500 text-white hover:bg-gray-600"
                      >
                        <X className="w-4 h-4" />
                        {t(common.cancel)}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(item.id)
                          onClose()
                        }}
                        className="flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        <Trash className="w-4 h-4" />
                        {t(common.confirm)} {t(common.delete)}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteMode(true)}
                      className="w-full mt-2 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700"
                    >
                      <Trash className="w-4 h-4" />
                      {t(common.delete)}
                    </button>
                  )}
                </>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
