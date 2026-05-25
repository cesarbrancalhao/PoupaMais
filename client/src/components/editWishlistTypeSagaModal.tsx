'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, Home, Plug, Shirt, ShoppingCart, Utensils, Car, Heart, BookOpen, Briefcase, Gift, Apple, Gamepad2, Save, PiggyBank, Plane, GraduationCap, PawPrint, Pill, Wrench, Wifi, Zap, Monitor, Baby, Banknote, Dumbbell, Music, Building2, Phone, Sparkles, Coffee, CreditCard, Train, Wallet, Trash
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WishlistType, WishlistSaga } from '@/types'
import { wishlistTypeService, wishlistSagaService } from '@/services'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { editWishlistTypeSagaModal } from '@/app/terminology/language/modals/editWishlistTypeSaga'
import { addWishlistTypeSagaModal } from '@/app/terminology/language/modals/addWishlistTypeSaga'
import { common } from '@/app/terminology/language/common'

interface EditWishlistTypeSagaModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'types' | 'sagas'
  item: WishlistType | WishlistSaga
  onDelete?: (id: number) => void
}

const availableIcons = [
  { name: 'Home', component: Home },
  { name: 'Plug', component: Plug },
  { name: 'Shirt', component: Shirt },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Gamepad-2', component: Gamepad2 },
  { name: 'Apple', component: Apple },
  { name: 'Utensils', component: Utensils },
  { name: 'Car', component: Car },
  { name: 'Heart', component: Heart },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Gift', component: Gift },
  { name: 'PiggyBank', component: PiggyBank },
  { name: 'Plane', component: Plane },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'PawPrint', component: PawPrint },
  { name: 'Pill', component: Pill },
  { name: 'Wrench', component: Wrench },
  { name: 'Wifi', component: Wifi },
  { name: 'Zap', component: Zap },
  { name: 'Monitor', component: Monitor },
  { name: 'Baby', component: Baby },
  { name: 'Banknote', component: Banknote },
  { name: 'Dumbbell', component: Dumbbell },
  { name: 'Music', component: Music },
  { name: 'Building2', component: Building2 },
  { name: 'Phone', component: Phone },
  { name: 'Sparkles', component: Sparkles },
  { name: 'Coffee', component: Coffee },
  { name: 'CreditCard', component: CreditCard },
  { name: 'Train', component: Train },
  { name: 'Wallet', component: Wallet },
]

export default function EditWishlistTypeSagaModal({
  isOpen, onClose, type, item, onDelete
}: EditWishlistTypeSagaModalProps) {

  const [name, setName] = useState(item.name)
  const [icon, setIcon] = useState(item.icon || 'Heart')
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { t } = useLanguage()

  useEffect(() => {
    setName(item.name)
    setIcon(item.icon || 'Heart')
    setShowError(false)
    setConfirmDeleteMode(false)
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (type === 'types') {
        await wishlistTypeService.update(item.id, { name, icon })
      } else {
        await wishlistSagaService.update(item.id, { name, icon })
      }

      onClose()
    } catch (error) {
      console.error('Error updating:', error)
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
                  <span className="font-medium">{t(editWishlistTypeSagaModal.errorUpdating)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">
                {type === 'types' ? t(editWishlistTypeSagaModal.editTypeTitle) : t(editWishlistTypeSagaModal.editSagaTitle)}
              </h2>
              <button onClick={onClose} className="text-gray-700 hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">{t(common.name)}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3 text-gray-800">{t(addWishlistTypeSagaModal.icon)}</label>
                <div className="grid grid-cols-4 gap-3">
                  {availableIcons.map(iconObj => {
                    const IconComponent = iconObj.component
                    const isSelected = icon === iconObj.name
                    return (
                      <button
                        key={iconObj.name}
                        type="button"
                        onClick={() => setIcon(iconObj.name)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        <IconComponent
                          className={`w-6 h-6 mx-auto ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
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
