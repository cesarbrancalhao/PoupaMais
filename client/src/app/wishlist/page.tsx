'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import AddWishlistItemModal from '@/components/addWishlistItemModal'
import EditWishlistItemModal from '@/components/editWishlistItemModal'
import AddWishlistTypeSagaModal from '@/components/addWishlistTypeSagaModal'
import EditWishlistTypeSagaModal from '@/components/editWishlistTypeSagaModal'
import { Home, Plug, Shirt, ShoppingCart, Utensils, Car, Heart, BookOpen, Briefcase, Gift, Apple, Gamepad2, PiggyBank, Plane, GraduationCap, PawPrint, Pill, Wrench, Wifi, Zap, Monitor, Baby, Banknote, Dumbbell, Music, Building2, Phone, Sparkles, Coffee, CreditCard, Train, Wallet, Plus, Settings, ArrowLeft, Search } from 'lucide-react'
import { WishlistItem, WishlistType, WishlistSaga } from '@/types'
import { wishlistService, wishlistTypeService, wishlistSagaService, ApiError } from '@/services'
import { formatCurrency as formatMoney } from "@/app/terminology/currency";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from '@/app/terminology/LanguageContext';
import { wishlist } from '@/app/terminology/language/wishlist';
import { common } from '@/app/terminology/language/common';
import { dashboard } from '@/app/terminology/language/dashboard';
import { generateQuarterOptions } from '@/lib/quarters';

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

function getIconComponent(iconName: string) {
  const icon = availableIcons.find(i => i.name === iconName)
  return icon ? icon.component : Heart
}

const PRIORITIES = ['low', 'medium', 'high'] as const
const QUARTERS = generateQuarterOptions()

export default function WishlistPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [types, setTypes] = useState<WishlistType[]>([])
  const [sagas, setSagas] = useState<WishlistSaga[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showConfigView, setShowConfigView] = useState(false)
  const [configTab, setConfigTab] = useState<'types' | 'sagas'>('types')

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null)

  const [isTypeSagaModalOpen, setIsTypeSagaModalOpen] = useState(false)
  const [selectedTypeSaga, setSelectedTypeSaga] = useState<WishlistType | WishlistSaga | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [sortColumn, setSortColumn] = useState<'name' | 'price' | 'priority' | 'quarter' | 'saga' | 'created_at'>('quarter')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filterChecked, setFilterChecked] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterSaga, setFilterSaga] = useState('all')
  const [filterQuarter, setFilterQuarter] = useState('all')

  useEffect(() => {
    setCurrentPage(1)
  }, [sortColumn, sortDirection, searchTerm, minPrice, maxPrice, filterChecked, filterPriority, filterType, filterSaga, filterQuarter])

  const fetchData = useCallback(async () => {
    if (!user) return
    try {
      setLoading(true)
      setError(null)
      const [itemsResponse, typesResponse, sagasResponse] = await Promise.all([
        wishlistService.getAll(1, 2000),
        wishlistTypeService.getAll(),
        wishlistSagaService.getAll(),
      ])
      const itemsData = Array.isArray(itemsResponse)
        ? itemsResponse
        : (itemsResponse?.data || [])
      setItems(itemsData)
      setTypes(typesResponse)
      setSagas(sagasResponse)
    } catch (err) {
      const error = err as ApiError
      if (error && (error.status === 401 || error.status === 403)) {
        setLoading(false)
        return
      }
      console.error('Error fetching data:', err)
      setError(t(wishlist.errorLoading))
    } finally {
      setLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (minPrice && item.price < parseFloat(minPrice.replace(',', '.'))) return false
      if (maxPrice && item.price > parseFloat(maxPrice.replace(',', '.'))) return false
      if (filterChecked === 'bought' && !item.checked) return false
      if (filterChecked === 'not_bought' && item.checked) return false
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false
      if (filterType !== 'all' && item.wishlist_type_id?.toString() !== filterType) return false
      if (filterSaga !== 'all' && item.saga_id?.toString() !== filterSaga) return false
      if (filterQuarter !== 'all' && item.quarter !== filterQuarter) return false
      return true
    })
  }, [items, searchTerm, minPrice, maxPrice, filterChecked, filterPriority, filterType, filterSaga, filterQuarter])

  const priorityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 }

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0
      if (sortColumn === 'name') comparison = a.name.localeCompare(b.name)
      else if (sortColumn === 'price') comparison = a.price - b.price
      else if (sortColumn === 'priority') comparison = (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
      else if (sortColumn === 'quarter') {
        const [yearA, quarterA] = [parseInt(a.quarter.slice(0, 2)), parseInt(a.quarter.slice(3))]
        const [yearB, quarterB] = [parseInt(b.quarter.slice(0, 2)), parseInt(b.quarter.slice(3))]
        comparison = yearA - yearB || quarterA - quarterB
      }
      else if (sortColumn === 'saga') {
        const sagaA = (sagas.find(s => s.id === a.saga_id)?.name || '')
        const sagaB = (sagas.find(s => s.id === b.saga_id)?.name || '')
        comparison = sagaA.localeCompare(sagaB)
      }
      else if (sortColumn === 'created_at') comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredItems, sortColumn, sortDirection, sagas])

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  const toggleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const openItemModal = (item?: WishlistItem) => {
    setSelectedItem(item || null)
    setIsItemModalOpen(true)
  }

  const closeItemModal = () => {
    setIsItemModalOpen(false)
    setSelectedItem(null)
    fetchData()
  }

  const handleItemDelete = async (id: number) => {
    try {
      await wishlistService.delete(id)
    } catch (err) {
      console.error('Error deleting item:', err)
    }
  }

  const openTypeSagaModal = (entity?: WishlistType | WishlistSaga) => {
    setSelectedTypeSaga(entity || null)
    setIsTypeSagaModalOpen(true)
  }

  const closeTypeSagaModal = () => {
    setIsTypeSagaModalOpen(false)
    setSelectedTypeSaga(null)
    fetchData()
  }

  const handleTypeSagaDelete = async (id: number) => {
    try {
      if (configTab === 'types') {
        await wishlistTypeService.delete(id)
      } else {
        await wishlistSagaService.delete(id)
      }
    } catch (err) {
      console.error('Error deleting:', err)
    }
  }

  const priorityLabel = (p: string) => {
    if (p === 'low') return t(wishlist.low)
    if (p === 'high') return t(wishlist.high)
    return t(wishlist.medium)
  }

  const quarterLabel = (q: string) => q

  const getTypeName = (typeId?: number) => {
    if (!typeId) return ''
    return types.find(t => t.id === typeId)?.name || ''
  }

  const getSagaName = (sagaId?: number) => {
    if (!sagaId) return ''
    return sagas.find(s => s.id === sagaId)?.name || ''
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center">
            <p className="text-gray-500">{t(wishlist.loading)}</p>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 md:ml-64">
          {showConfigView ? (
            <>
              <header className="flex items-center gap-4 mb-6 md:mb-8">
                <button
                  onClick={() => setShowConfigView(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                  {configTab === 'types' ? t(dashboard.configureWishlistTypes) : t(dashboard.configureWishlistSagas)}
                </h1>
              </header>

              <div className="flex gap-1 mb-6 md:mb-8">
                <button
                  onClick={() => setConfigTab('types')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    configTab === 'types'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t(wishlist.type)}
                </button>
                <button
                  onClick={() => setConfigTab('sagas')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    configTab === 'sagas'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t(wishlist.saga)}
                </button>
              </div>

              <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
                <div className="w-full xl:w-4/6">
                  <section className="bg-white text-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-4">
                      {configTab === 'types' ? t(wishlist.type) : t(wishlist.saga)}
                    </h2>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-gray-500 border-b border-gray-200">
                          <tr>
                            <th className="py-3 font-medium text-left w-20">Icon</th>
                            <th className="py-3 font-medium text-left">Name</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          {(configTab === 'types' ? types : sagas).map((entity) => {
                            const IconComponent = getIconComponent(entity.icon || 'Heart')
                            return (
                              <tr
                                key={entity.id}
                                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => openTypeSagaModal(entity)}
                              >
                                <td className="py-4">
                                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                                    <IconComponent className="w-6 h-6 text-blue-600" />
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className="text-blue-600 hover:underline">{entity.name}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={() => openTypeSagaModal()}
                      className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t(common.add)} {configTab === 'types' ? t(wishlist.type).toLowerCase() : t(wishlist.saga).toLowerCase()}
                    </button>
                  </section>
                </div>

                <div className="w-full xl:w-2/6">
                  <div className="bg-white text-gray-800 p-4 md:p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs md:text-sm">{t(wishlist.allItems)}</p>
                        <p className="text-lg md:text-2xl font-semibold">{items.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800">{t(wishlist.title)}</h1>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setConfigTab('types')
                      setShowConfigView(true)
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Settings className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-xs md:text-sm">{t(dashboard.configureWishlistTypesOrSagas)}</span>
                  </button>
                  <button
                    onClick={() => openItemModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t(wishlist.addItem)}
                  </button>
                </div>
              </header>

              <section className="bg-white text-gray-800 p-4 md:p-6 rounded-xl shadow-sm mb-4 md:mb-6">
                <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder={t(common.search)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={t(common.minValue)}
                        value={minPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,.-]/g, '')
                          setMinPrice(value)
                        }}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder={t(common.maxValue)}
                        value={maxPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d,.-]/g, '')
                          setMaxPrice(value)
                        }}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <select
                        value={filterChecked}
                        onChange={(e) => setFilterChecked(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="all">{t(wishlist.allChecked)}</option>
                        <option value="bought">{t(wishlist.bought)}</option>
                        <option value="not_bought">{t(wishlist.notBought)}</option>
                      </select>
                    </div>
                    <div>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="all">{t(wishlist.allPriorities)}</option>
                        {PRIORITIES.map(p => (
                          <option key={p} value={p}>{priorityLabel(p)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 xl:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <div>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="all">{t(wishlist.allTypes)}</option>
                          {types.map(type => (
                            <option key={type.id} value={type.id.toString()}>{type.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={filterSaga}
                          onChange={(e) => setFilterSaga(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="all">{t(wishlist.allSagas)}</option>
                          {sagas.map(saga => (
                            <option key={saga.id} value={saga.id.toString()}>{saga.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={filterQuarter}
                          onChange={(e) => setFilterQuarter(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-md border bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="all">{t(wishlist.allQuarters)}</option>
                          {QUARTERS.map(q => (
                            <option key={q} value={q}>{quarterLabel(q)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {sortedItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t(wishlist.noItems)}</p>
                    <p className="text-sm mt-2">{t(wishlist.clickToAdd)}</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-gray-500 border-b border-gray-200">
                          <tr>
                            <th
                              className="py-3 font-medium text-left cursor-pointer hover:text-gray-700"
                              onClick={() => toggleSort('name')}
                            >
                              {t(wishlist.name)} {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                              className="py-3 font-medium text-left cursor-pointer hover:text-gray-700"
                              onClick={() => toggleSort('price')}
                            >
                              {t(wishlist.price)} {sortColumn === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                              className="py-3 font-medium text-left cursor-pointer hover:text-gray-700"
                              onClick={() => toggleSort('priority')}
                            >
                              {t(wishlist.priority)} {sortColumn === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th
                              className="py-3 font-medium text-left cursor-pointer hover:text-gray-700"
                              onClick={() => toggleSort('quarter')}
                            >
                              {t(wishlist.quarter)} {sortColumn === 'quarter' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="py-3 font-medium text-left">{t(wishlist.type)}</th>
                            <th
                              className="py-3 font-medium text-left cursor-pointer hover:text-gray-700"
                              onClick={() => toggleSort('saga')}
                            >
                              {t(wishlist.saga)} {sortColumn === 'saga' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="py-3 font-medium text-center">{t(wishlist.checked)}</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          {paginatedItems.map(item => {
                            const TypeIcon = item.wishlist_type_id
                              ? getIconComponent(types.find(t => t.id === item.wishlist_type_id)?.icon || 'Heart')
                              : null
                            const SagaIcon = item.saga_id
                              ? getIconComponent(sagas.find(s => s.id === item.saga_id)?.icon || 'BookOpen')
                              : null
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${item.checked ? 'opacity-60' : ''}`}
                                onClick={() => openItemModal(item)}
                              >
                                <td className={`py-4 ${item.checked ? 'line-through' : ''}`}>{item.name}</td>
                                <td className="py-4">{formatMoney(item.price, user?.currency ?? 'real')}</td>
                                <td className="py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'low' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {priorityLabel(item.priority)}
                                  </span>
                                </td>
                                <td className="py-4">{quarterLabel(item.quarter)}</td>
                                <td className="py-4">
                                  {TypeIcon && (
                                    <div className="flex items-center gap-2">
                                      <TypeIcon className="w-4 h-4 text-gray-500" />
                                      <span>{getTypeName(item.wishlist_type_id)}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4">
                                  {SagaIcon && (
                                    <div className="flex items-center gap-2">
                                      <SagaIcon className="w-4 h-4 text-gray-500" />
                                      <span>{getSagaName(item.saga_id)}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 text-center">
                                  {item.checked ? (
                                    <span className="text-green-500 font-medium">✓</span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          {t(common.previous)}
                        </button>
                        <span className="text-sm text-gray-500">
                          {currentPage} {t(common.of)} {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded text-sm border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          {t(common.next)}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {/* Item Modals */}
          {isItemModalOpen && !selectedItem && (
            <AddWishlistItemModal
              isOpen={isItemModalOpen}
              onClose={closeItemModal}
              types={types}
              sagas={sagas}
            />
          )}

          {isItemModalOpen && selectedItem && (
            <EditWishlistItemModal
              isOpen={isItemModalOpen}
              onClose={closeItemModal}
              item={selectedItem}
              types={types}
              sagas={sagas}
              onDelete={handleItemDelete}
            />
          )}

          {/* Type/Saga Modals */}
          {isTypeSagaModalOpen && !selectedTypeSaga && (
            <AddWishlistTypeSagaModal
              isOpen={isTypeSagaModalOpen}
              onClose={closeTypeSagaModal}
              type={configTab}
            />
          )}

          {isTypeSagaModalOpen && selectedTypeSaga && (
            <EditWishlistTypeSagaModal
              isOpen={isTypeSagaModalOpen}
              onClose={closeTypeSagaModal}
              type={configTab}
              item={selectedTypeSaga}
              onDelete={handleTypeSagaDelete}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
