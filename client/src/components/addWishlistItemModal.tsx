'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WishlistType, WishlistSaga } from '@/types'
import { wishlistService } from '@/services/wishlist.service'
import { getCurrencySymbol } from '@/app/terminology/currency'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { addWishlistItemModal } from '@/app/terminology/language/modals/addWishlistItem'
import { common } from '@/app/terminology/language/common'
import { wishlist } from '@/app/terminology/language/wishlist'

interface AddWishlistItemModalProps {
  isOpen: boolean
  onClose: () => void
  types: WishlistType[]
  sagas: WishlistSaga[]
}

const PRIORITIES = ['low', 'medium', 'high'] as const
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const

export default function AddWishlistItemModal({ isOpen, onClose, types, sagas }: AddWishlistItemModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [checked, setChecked] = useState(false)
  const [priority, setPriority] = useState('medium')
  const [quarter, setQuarter] = useState('Q1')
  const [typeId, setTypeId] = useState('')
  const [sagaId, setSagaId] = useState('')
  const [showError, setShowError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setPrice('')
      setChecked(false)
      setPriority('medium')
      setQuarter('Q1')
      setTypeId('')
      setSagaId('')
      setShowError(false)
    }
  }, [isOpen])

  const priorityLabel = (p: string) => {
    if (p === 'low') return t(addWishlistItemModal.low)
    if (p === 'high') return t(addWishlistItemModal.high)
    return t(addWishlistItemModal.medium)
  }

  const quarterLabel = (q: string) => {
    if (q === 'Q1') return t(addWishlistItemModal.q1)
    if (q === 'Q2') return t(addWishlistItemModal.q2)
    if (q === 'Q3') return t(addWishlistItemModal.q3)
    return t(addWishlistItemModal.q4)
  }

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
      await wishlistService.create(data)
      onClose()
    } catch (error) {
      console.error('Error creating item:', error)
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
            className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col p-6 overflow-y-auto shadow-xl bg-white text-gray-800"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence>
              {showError && (
                <motion.div
                  className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3 bg-red-500 text-white"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(addWishlistItemModal.errorAdding)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {t(addWishlistItemModal.title)}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1">{t(wishlist.name)}</label>
                <input
                  type="text"
                  placeholder={t(addWishlistItemModal.namePlaceholder)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 outline-none transition bg-gray-50 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t(wishlist.price)}</label>
                <div className="flex items-center rounded-lg overflow-hidden bg-gray-50">
                  <span className="px-3 py-2 font-medium text-gray-600">
                    {getCurrencySymbol(user?.currency)}
                  </span>
                  <input
                    type="text"
                    placeholder={t(addWishlistItemModal.pricePlaceholder)}
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
                <label htmlFor="itemChecked" className="text-sm font-medium">{t(wishlist.checked)}</label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t(addWishlistItemModal.priority)}</label>
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
                <label className="block text-sm font-medium mb-1">{t(addWishlistItemModal.quarter)}</label>
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
                <label className="block text-sm font-medium mb-1">{t(wishlist.type)}</label>
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
                <label className="block text-sm font-medium mb-1">{t(wishlist.saga)}</label>
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

              <button
                type="submit"
                className="w-full mt-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                {t(common.save)}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
