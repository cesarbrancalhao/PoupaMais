'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X, Home, Plug, Shirt, ShoppingCart, Utensils, Car, Heart,
  BookOpen, Briefcase, Gift, Apple, Gamepad2, Save, Trash
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExpenseCategory, IncomeSource } from '@/types'
import { expenseCategoryService } from '@/services/categories.service'
import { incomeSourcesService } from '@/services/income-sources.service'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { editCategoriaModal } from '@/app/terminology/language/modals/editCategoria'
import { addCategoriaModal } from '@/app/terminology/language/modals/addCategoria'
import { common } from '@/app/terminology/language/common'

interface EditCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'categories' | 'sources'
  item: ExpenseCategory | IncomeSource
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
]

export default function EditCategoryModal({
  isOpen, onClose, type, item, onDelete
}: EditCategoryModalProps) {

  const [name, setName] = useState(item.name)
  const [icon, setIcon] = useState(item.icon || 'Home')
  const [showError, setShowError] = useState(false)
  const [confirmDeleteMode, setConfirmDeleteMode] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { t } = useLanguage()

  useEffect(() => {
    setName(item.name)
    setIcon(item.icon || 'Home')
    setShowError(false)
    setConfirmDeleteMode(false)
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (type === 'categories') {
        await expenseCategoryService.update(item.id, { name, icon })
      } else {
        await incomeSourcesService.update(item.id, { name, icon })
      }

      onClose()
    } catch (error) {
      console.error('Error updating:', error)
      setShowError(true)
      setTimeout(() => setShowError(false), 3000)
    }
  }

  const bgModal = 'bg-white'
  const textMain = 'text-gray-800'
  const textSecondary = 'text-gray-700'
  const inputBg = 'bg-gray-50'
  const inputText = 'text-gray-700'
  const borderDefault = 'border-gray-200'
  const selectedBorder = 'border-blue-600'
  const selectedBg = 'bg-blue-50'
  const iconInactive = 'text-gray-600'

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
            className={`fixed right-0 top-0 h-full w-full max-w-md ${bgModal} shadow-xl z-50 flex flex-col p-6 overflow-y-auto border-l ${
              'border-gray-200'
            }`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >

            <AnimatePresence>
              {showError && (
                <motion.div
                  className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                  bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(editCategoriaModal.errorUpdating)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${textMain}`}>
                {type === 'categories' ? t(editCategoriaModal.editCategoryTitle) : t(editCategoriaModal.editSourceTitle)}
              </h2>
              <button onClick={onClose} className={`${textSecondary} hover:opacity-80`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${textMain}`}>{t(common.name)}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full ${inputBg} ${inputText} rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-3 ${textMain}`}>{t(addCategoriaModal.icon)}</label>
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
                            ? `${selectedBorder} ${selectedBg}`
                            : `${borderDefault} hover:border-blue-500`
                        }`}
                      >
                        <IconComponent
                          className={`w-6 h-6 mx-auto ${
                            isSelected ? 'text-blue-600' : iconInactive
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
                  className={`w-full mt-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {t(common.save)} {type === 'categories' ? t(common.category).toLowerCase() : t(common.source).toLowerCase()}
                </button>
              )}

              {onDelete && (
                <>
                  {confirmDeleteMode ? (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteMode(false)}
                        className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          'bg-gray-500 text-white hover:bg-gray-600'
                        }`}
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
                        className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                          'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                      >
                        <Trash className="w-4 h-4" />
                        {t(common.confirm)} {t(common.delete)}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteMode(true)}
                      className={`w-full mt-2 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      <Trash className="w-4 h-4" />
                      {t(common.delete)} {type === 'categories' ? t(common.category).toLowerCase() : t(common.source).toLowerCase()}
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
