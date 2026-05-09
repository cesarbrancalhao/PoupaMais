'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Home, Plug, Shirt, ShoppingCart, Utensils, Car, Heart, BookOpen, Briefcase, Gift, Apple, Gamepad2, Save, PiggyBank, Plane, GraduationCap, PawPrint, Pill, Wrench, Wifi, Zap, Monitor, Baby, Banknote, Dumbbell, Music, Building2, Phone, Sparkles, Coffee, CreditCard, Train, Wallet } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { expenseCategoryService } from '@/services/categories.service'
import { incomeSourcesService } from '@/services/income-sources.service'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { addCategoriaModal } from '@/app/terminology/language/modals/addCategoria'
import { common } from '@/app/terminology/language/common'

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'categories' | 'sources'
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

export default function AddCategoryModal({ isOpen, onClose, type }: AddCategoryModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('Home')
  const [showError, setShowError] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const { t } = useLanguage()

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setIcon('Home')
      setShowError(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (type === 'categories') {
        await expenseCategoryService.create({ name, icon })
      } else {
        await incomeSourcesService.create({ name, icon })
      }

      onClose()
    } catch (error) {
      console.error('Error creating:', error)
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
            className={`fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col p-6 overflow-y-auto shadow-xl
              transition-colors
              ${"bg-white text-gray-800"}
            `}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence>
              {showError && (
                <motion.div
                  className={`
                    fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    px-6 py-4 rounded-lg shadow-2xl z-[60] flex items-center gap-3
                    ${"bg-red-500 text-white"}
                  `}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{t(addCategoriaModal.errorAdding)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {type === 'categories' ? t(addCategoriaModal.addCategoryTitle) : t(addCategoriaModal.addSourceTitle)}
              </h2>
              <button
                onClick={onClose}
                className={`transition ${"text-gray-500 hover:text-gray-700"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t(common.name)}
                </label>
                <input
                   type="text"
                      placeholder={t(addCategoriaModal.namePlaceholder)}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                  className={`
                    w-full rounded-lg px-3 py-2 outline-none transition
                    ${"bg-gray-50 text-gray-700 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"}
                  `}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  {t(addCategoriaModal.icon)}
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {availableIcons.map((iconObj) => {
                    const IconComponent = iconObj.component
                    const isSelected = icon === iconObj.name

                    return (
                      <button
                        key={iconObj.name}
                        type="button"
                         onClick={() => setIcon(iconObj.name)}
                        className={`
                          p-4 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? "border-blue-600 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                          }
                        `}
                      >
                        <IconComponent
                          className={`w-6 h-6 mx-auto transition
                            ${isSelected 
                              ? "text-blue-500" 
                              : "text-gray-600"
                            }
                          `}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                className={`
                  w-full mt-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition
                  ${"bg-blue-600 hover:bg-blue-700 text-white"
                  }
                `}
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
