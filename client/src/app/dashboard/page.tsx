'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '@/components/sidebar'
import AddDashboardModal from '@/components/addDashboardModal'
import EditDashboardModal from '@/components/editDashboardModal'
import AddCategoriaModal from '@/components/addCategoriaModal'
import EditCategoriaModal from '@/components/editCategoriaModal'
import ProtectedRoute from '@/components/ProtectedRoute'
import BalanceChart from '@/components/BalanceChart'
import DespesasChart from '@/components/DespesasChart'
import ReceitasChart from '@/components/ReceitasChart'
import { Home, Plug, Shirt, DollarSign, ShoppingCart, CreditCard, Settings, ArrowLeft, Utensils, Car, Heart, BookOpen, Briefcase, Gift, Apple, Gamepad2, Plus, TrendingUp, PieChart, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { Despesa, Receita, CategoriaDespesa, FonteReceita, DespesaExclusao, ReceitaExclusao } from '@/types'
import { despesasService, receitasService, despesasExclusaoService, receitasExclusaoService, ApiError } from '@/services'
import { categoriasDespesaService } from '@/services/categorias.service'
import { fontesReceitaService } from '@/services/fontes.service'
import { formatCurrency as formatMoney } from "@/app/terminology/currency";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from '@/app/terminology/LanguageContext';
import { dashboard } from '@/app/terminology/language/dashboard';
import { common } from '@/app/terminology/language/common';

interface TableRow {
  id: string
  date: string
  name: string
  category: string
  categoryId: number | undefined
  value: string
  saldo: string
  recurring: boolean
  icon: React.ReactNode
  originalId: number
  displayMonth: string
}

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'despesas' | 'receitas'>('despesas')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TableRow | null>(null)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([])
  const [fontes, setFontes] = useState<FonteReceita[]>([])
  const [despesasExclusoes, setDespesasExclusoes] = useState<DespesaExclusao[]>([])
  const [receitasExclusoes, setReceitasExclusoes] = useState<ReceitaExclusao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [showConfigView, setShowConfigView] = useState(false)
  const [configTab, setConfigTab] = useState<'categorias' | 'fontes'>('categorias')
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [selectedConfigItem, setSelectedConfigItem] = useState<CategoriaDespesa | FonteReceita | null>(null)
  const { user } = useAuth();

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  const [sortColumn, setSortColumn] = useState<'date' | 'name' | 'value' | 'category'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    setCurrentPage(1)
    setSearchTerm('')
    setMinValue('')
    setMaxValue('')
    setFilterCategory('all')
  }, [activeTab])

  useEffect(() => {
    setCurrentPage(1)
  }, [sortColumn, sortDirection, searchTerm, minValue, maxValue, filterCategory])

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true)
      setError(null)
      const [despesasResponse, receitasResponse, categoriasResponse, fontesResponse, despesasExclusoesResponse, receitasExclusoesResponse] = await Promise.all([
        despesasService.getAll(1, 2000),
        receitasService.getAll(1, 2000),
        categoriasDespesaService.getAll(),
        fontesReceitaService.getAll(),
        despesasExclusaoService.getAll(),
        receitasExclusaoService.getAll()
      ])
      
      const despesasData = Array.isArray(despesasResponse)
        ? despesasResponse
        : (despesasResponse?.data || [])
      const receitasData = Array.isArray(receitasResponse)
        ? receitasResponse
        : (receitasResponse?.data || [])

      setDespesas(despesasData)
      setReceitas(receitasData)
      setCategorias(categoriasResponse)
      setFontes(fontesResponse)
      setDespesasExclusoes(despesasExclusoesResponse)
      setReceitasExclusoes(receitasExclusoesResponse)
    } catch (err) {
      const error = err as ApiError;
      if (error && (error.status === 401 || error.status === 403)) {
        setLoading(false);
        return;
      }
      console.error('Erro ao buscar dados:', err)
      setError(`${t(dashboard.errorLoadingData)}. ${t(common.checkConnection)}`)
    } finally {
      setLoading(false)
    }
  }, [t, user])

  useEffect(() => {
    fetchData()
    const now = new Date()
    const currentMonth = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
    setSelectedMonth(currentMonth)
  }, [fetchData])

  const monthOptions = useMemo(() => {
    const months = []
    const now = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      months.push(`${month}-${year}`)
    }

    return months
  }, [])

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    fetchData()
  }

  const openEditModal = (item: TableRow) => {
    setSelectedItem(item)
    setIsEditModalOpen(true)
  }
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    try {
      if (activeTab === 'despesas') {
        await despesasService.delete(Number(id))
      } else {
        await receitasService.delete(Number(id))
      }
      fetchData()
    } catch (err) {
      console.error('Erro ao excluir item:', err)
      setError('Erro ao excluir item. Tente novamente.')
    }
  }

  const handleConfigDelete = async (id: number) => {
    try {
      if (configTab === 'categorias') {
        await categoriasDespesaService.delete(id)
      } else {
        await fontesReceitaService.delete(id)
      }
      fetchData()
    } catch (err) {
      console.error('Erro ao excluir item:', err)
      setError('Erro ao excluir item. Tente novamente.')
    }
  }

  const openConfigModal = (item?: CategoriaDespesa | FonteReceita) => {
    setSelectedConfigItem(item || null)
    setIsConfigModalOpen(true)
  }

  const closeConfigModal = () => {
    setIsConfigModalOpen(false)
    setSelectedConfigItem(null)
    fetchData()
  }

  const convertDateForEditModal = (dateStr: string, monthContext?: string) => {
    const [day = '01', originalMonth = '01'] = dateStr.split('/')
    const referenceMonth = monthContext || selectedMonth
    let targetMonth = originalMonth.padStart(2, '0')
    let targetYear = new Date().getFullYear().toString()

    if (referenceMonth) {
      const [contextMonth, contextYear] = referenceMonth.split('-')
      if (contextMonth) {
        targetMonth = contextMonth.padStart(2, '0')
      }
      if (contextYear) {
        targetYear = contextYear
      }
    }

    return `${targetYear}-${targetMonth}-${day.padStart(2, '0')}`
  }

  const formatDate = (dateString: string, monthContext?: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    let month = String(date.getMonth() + 1).padStart(2, '0')

    if (monthContext) {
      const [contextMonth] = monthContext.split('-')
      if (contextMonth) {
        month = contextMonth.padStart(2, '0')
      }
    }

    return `${day}/${month}`
  }

  const formatCurrency = (value: number) => {
    return formatMoney(value, user?.moeda || "real");
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      'Home': Home,
      'Plug': Plug,
      'Shirt': Shirt,
      'ShoppingCart': ShoppingCart,
      'DollarSign': DollarSign,
      'CreditCard': CreditCard,
      'Utensils': Utensils,
      'Car': Car,
      'Heart': Heart,
      'BookOpen': BookOpen,
      'Briefcase': Briefcase,
      'Gift': Gift,
      'Apple': Apple,
      'Gamepad-2': Gamepad2,
    }
    const IconComponent = iconMap[iconName] || Home
    return IconComponent
  }

  const calculateSaldo = (items: (Despesa | Receita)[], currentIndex: number, isReceita: boolean) => {
    let saldo = 0
    for (let i = items.length - 1; i >= currentIndex; i--) {
      const valor = Number(items[i].valor) || 0
      if (isReceita) {
        saldo += valor
      } else {
        saldo -= valor
      }
    }
    return saldo
  }

  // RN18 - O sistema armazenará Despesas e Receitas recorrentes como um único registro no banco, e usará uma função de expansão para exibir os registros mensais.
  const expandRecurringEntries = <T extends Despesa | Receita>(
    items: T[],
    selectedMonth: string,
    exclusoes: (DespesaExclusao | ReceitaExclusao)[]
  ): T[] => {
    if (!selectedMonth) return items

    const [month, year] = selectedMonth.split('-')
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    
    const expandedItems: T[] = []

    items.forEach(item => {
      const itemStartDate = new Date(item.data)
      const itemStartYear = itemStartDate.getFullYear()
      const itemStartMonth = itemStartDate.getMonth()
      const startOfItemMonth = new Date(itemStartYear, itemStartMonth, 1)

      if (item.recorrente) {
        // RN20 - Receitas e Despesas recorrentes sem uma data de vencimento definida são exibidas indefinidamente mês a mês.
        const targetYear = targetDate.getFullYear()
        const targetMonth = targetDate.getMonth()
        const targetMonthStart = new Date(targetYear, targetMonth, 1)
        
        if (startOfItemMonth <= targetMonthStart) {
          let isWithinEndDate = true
          if (item.data_vencimento) {
            const endDate = new Date(item.data_vencimento)
            const endYear = endDate.getFullYear()
            const endMonth = endDate.getMonth()
            const endMonthStart = new Date(endYear, endMonth, 1)
            isWithinEndDate = targetMonthStart <= endMonthStart
          }

          if (isWithinEndDate) {
            const monthKey = `${year}-${month}-01`
            // RN19 - A expansão de Despesas e Receitas recorrentes utilizará as tabelas de Exclusão de Receita e Exclusão de Despesa para remover registros de cálculos, exibições, gráficos e Análise.
            const isExcluded = exclusoes.some(exc => {
              const isDespesa = 'despesa_id' in exc
              const itemId = isDespesa ? (exc as DespesaExclusao).despesa_id : (exc as ReceitaExclusao).receita_id
              const excDate = new Date(exc.data_exclusao)
              const excYear = excDate.getFullYear()
              const excMonth = String(excDate.getMonth() + 1).padStart(2, '0')
              const excKey = `${excYear}-${excMonth}-01`
              
              return itemId === item.id && excKey === monthKey
            })

            if (!isExcluded) {
              const virtualEntry = { ...item }
              expandedItems.push(virtualEntry)
            }
          }
        }
      } else {
        const itemMonth = String(itemStartDate.getMonth() + 1).padStart(2, '0')
        const itemYear = itemStartDate.getFullYear().toString()
        if (itemMonth === month && itemYear === year) {
          expandedItems.push(item)
        }
      }
    })

    return expandedItems
  }

  const filteredDespesas = expandRecurringEntries(despesas, selectedMonth, despesasExclusoes)
  const filteredReceitas = expandRecurringEntries(receitas, selectedMonth, receitasExclusoes)

  const despesasRows: TableRow[] = (filteredDespesas ?? []).map((despesa, index) => {
    const categoria = categorias.find(c => c.id === despesa.categoria_despesa_id)
    const IconComponent = getIconComponent(categoria?.icone || 'DollarSign')
    return {
      id: despesa?.id?.toString?.() ?? '',
      date: despesa?.data ? formatDate(despesa.data, despesa?.recorrente ? selectedMonth : undefined) : '--/--',
      name: despesa?.nome ?? '',
      category: categoria?.nome ?? t(common.noCategory),
      categoryId: categoria?.id,
      value: despesa?.valor != null ? formatCurrency(despesa.valor) : 'R$ 0,00',
      saldo: formatCurrency(Math.abs(calculateSaldo(filteredDespesas ?? [], index, false))),
      recurring: despesa?.recorrente ?? false,
      icon: <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />,
      originalId: despesa?.id ?? 0,
      displayMonth: selectedMonth
    }
  })

  const receitasRows: TableRow[] = (filteredReceitas ?? []).map((receita, index) => {
    const fonte = fontes.find(f => f.id === receita.fonte_receita_id)
    const IconComponent = getIconComponent(fonte?.icone || 'DollarSign')
    return {
      id: receita?.id?.toString?.() ?? '',
      date: receita?.data ? formatDate(receita.data, receita?.recorrente ? selectedMonth : undefined) : '--/--',
      name: receita?.nome ?? '',
      category: fonte?.nome ?? t(common.noSource),
      categoryId: fonte?.id,
      value: receita?.valor != null ? formatCurrency(receita.valor) : 'R$ 0,00',
      saldo: formatCurrency(calculateSaldo(filteredReceitas ?? [], index, true)),
      recurring: receita?.recorrente ?? false,
      icon: <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-green-600" />,
      originalId: receita?.id ?? 0,
      displayMonth: selectedMonth
    }
  })

  const allRows = activeTab === 'despesas' ? despesasRows : receitasRows
  
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (searchTerm && !row.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      const cleanValue = row.value.replace(/[^\d,.-]/g, '').trim()
      const numericValue = parseFloat(cleanValue.replace(/\./g, '').replace(',', '.')) || 0
      
      if (minValue) {
        const min = parseFloat(minValue.replace(/\./g, '').replace(',', '.')) || 0
        if (numericValue < min) {
          return false
        }
      }
      
      if (maxValue) {
        const max = parseFloat(maxValue.replace(/\./g, '').replace(',', '.')) || 0
        if (numericValue > max) {
          return false
        }
      }
      
      if (filterCategory !== 'all') {
        const categoryId = parseInt(filterCategory)
        if (row.categoryId !== categoryId) {
          return false
        }
      }
      
      return true
    })
  }, [allRows, searchTerm, minValue, maxValue, filterCategory])
  
  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows]
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sortColumn) {
        case 'date':
          const [dayA] = a.date.split('/').map(Number)
          const [dayB] = b.date.split('/').map(Number)
          const [contextMonth, contextYear] = a.displayMonth.split('-').map(Number)
          const dateA = new Date(contextYear, contextMonth - 1, dayA)
          const dateB = new Date(contextYear, contextMonth - 1, dayB)
          comparison = dateA.getTime() - dateB.getTime()
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'value':
          const cleanValueA = a.value.replace(/[^\d,.-]/g, '').trim()
          const cleanValueB = b.value.replace(/[^\d,.-]/g, '').trim()
          const valueA = parseFloat(cleanValueA.replace(/\./g, '').replace(',', '.')) || 0
          const valueB = parseFloat(cleanValueB.replace(/\./g, '').replace(',', '.')) || 0
          comparison = valueA - valueB
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredRows, sortColumn, sortDirection])
  
  // RN25 - O sistema deverá conter paginação dos registros nas telas de Metas, Receitas e Despesas.
  const totalPages = Math.ceil(sortedRows.length / ITEMS_PER_PAGE)
  const paginatedRows = sortedRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [sortColumn, sortDirection, searchTerm, minValue, maxValue, filterCategory])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleSort = (column: 'date' | 'name' | 'value' | 'category') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const totalReceitas = (filteredReceitas ?? []).reduce((sum, r) => sum + (Number(r.valor) || 0), 0)
  const totalDespesas = (filteredDespesas ?? []).reduce((sum, d) => sum + (Number(d.valor) || 0), 0)

  const monthlyBalanceData = useMemo(() => {
    const balances = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const monthKey = `${month}-${year}`

      const monthDespesas = expandRecurringEntries(despesas, monthKey, despesasExclusoes)
      const monthReceitas = expandRecurringEntries(receitas, monthKey, receitasExclusoes)

      const totalReceitasMonth = monthReceitas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0)
      const totalDespesasMonth = monthDespesas.reduce((sum, d) => sum + (Number(d.valor) || 0), 0)
      const balance = totalReceitasMonth - totalDespesasMonth

      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const monthLabel = monthNames[date.getMonth()]

      balances.push({
        month: monthLabel,
        balance: balance
      })
    }

    return balances
  }, [despesas, receitas, despesasExclusoes, receitasExclusoes])

  const despesasChartData = useMemo(() => {
    const categoryTotals = new Map<number, number>()

    filteredDespesas.forEach(despesa => {
      if (despesa.categoria_despesa_id) {
        const currentTotal = categoryTotals.get(despesa.categoria_despesa_id) || 0
        categoryTotals.set(despesa.categoria_despesa_id, currentTotal + (Number(despesa.valor) || 0))
      }
    })

    const colors = ['#5B8FF9', '#F6BD60', '#F28B82']

    return Array.from(categoryTotals.entries()).map(([categoryId, total], index) => {
      const categoria = categorias.find(c => c.id === categoryId)
      return {
        category: categoria?.nome || 'Sem categoria',
        value: total,
        color: colors[index % colors.length]
      }
    })
  }, [filteredDespesas, categorias])

  const receitasChartData = useMemo(() => {
    const sourceTotals = new Map<number, number>()

    filteredReceitas.forEach(receita => {
      if (receita.fonte_receita_id) {
        const currentTotal = sourceTotals.get(receita.fonte_receita_id) || 0
        sourceTotals.set(receita.fonte_receita_id, currentTotal + (Number(receita.valor) || 0))
      }
    })

    const colors = ['#5B8FF9', '#F6BD60', '#C0C0C0']

    return Array.from(sourceTotals.entries()).map(([sourceId, total], index) => {
      const fonte = fontes.find(f => f.id === sourceId)
      return {
        source: fonte?.nome || 'Não Informado',
        value: total,
        color: colors[index % colors.length]
      }
    })
  }, [filteredReceitas, fontes])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 flex items-center justify-center ${''}`}>
            <div className={`${'text-gray-500'}`}>{t(common.loading)}</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 flex items-center justify-center ${''}`}>
            <div className="text-red-500">{error}</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className={`flex min-h-screen ${'bg-gray-50'}`}>
      <Sidebar />
      <main className={`flex-1 p-4 md:p-8 md:ml-64 ${''}`}>
        {showConfigView ? (
          <>
            <header className={`flex items-center gap-4 mb-6 md:mb-8 ${''}`}>
              <button
                onClick={() => setShowConfigView(false)}
                className={`${'p-2 hover:bg-gray-100 rounded-lg transition-colors'}`}
              >
                <ArrowLeft className={`w-5 h-5 ${'text-gray-600'}`} />
              </button>
              <h1 className={`${'text-xl md:text-2xl font-semibold text-gray-800'}`}>
                {configTab === 'categorias' ? t(dashboard.configureCategories) : t(dashboard.configureSources)}
              </h1>
            </header>

            <div className={`relative flex ${'bg-white'} rounded-lg w-fit mb-6 md:mb-8`}>
              <div className={`absolute top-0 h-full bg-blue-600 rounded-lg transition-all duration-200 ease-in-out ${
                configTab === 'categorias' 
                  ? language === 'pt' ? 'left-0 w-4/8' 
                    : language === 'es' ? 'left-0 w-5/11' 
                    : 'left-0 w-5/9'
                  : language === 'pt' ? 'left-5/9 w-3/7'
                    : language === 'es' ? 'left-3/6 w-4/8'
                    : 'left-5/9 w-4/9'
              }`}></div>
              <button
                onClick={() => setConfigTab('categorias')}
                className={`relative z-10 pl-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${configTab === 'categorias' ? ('text-white') : ('text-gray-600')}`}
              >
                {t(dashboard.expensesTab)}
              </button>
              <button
                onClick={() => setConfigTab('fontes')}
                className={`relative z-10 pl-5 pr-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${configTab === 'fontes' ? ('text-white') : ('text-gray-600')}`}
              >
                {t(dashboard.incomeTab)}
              </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
              <div className="w-full xl:w-4/6">
              <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                    {configTab === 'categorias' ? t(dashboard.expensesTab) : t(dashboard.incomeTab)}
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead className={`${'text-gray-500 border-b border-gray-200'}`}>
                        <tr>
                          <th className="py-3 font-medium text-left w-20">Ícone</th>
                          <th className="py-3 font-medium text-left">Nome</th>
                        </tr>
                      </thead>
                      <tbody className={`${'text-gray-700'}`}>
                        {(configTab === 'categorias' ? categorias : fontes).map((item) => {
                          const IconComponent = getIconComponent(item.icone || 'Home')

                          return (
                            <tr
                              key={item.id}
                              className={`${'border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors'}`}
                              onClick={() => openConfigModal(item)}
                            >
                              <td className="py-4">
                              <div className={`${'w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center'}`}>
                                  <IconComponent className="w-6 h-6 text-blue-600" />
                                </div>
                              </td>
                              <td className="py-4">
                              <span className={`text-blue-600 hover:underline ${''}`}>{item.nome}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => openConfigModal()}
                    className={`mt-6 ${'bg-blue-600 text-white'} px-6 py-3 rounded-lg text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2`}
                  >
                    {t(common.add)} {configTab === 'categorias' ? t(common.category).toLowerCase() : t(common.source).toLowerCase()}
                  </button>
                </section>
              </div>

              <div className="w-full xl:w-2/6 flex flex-col gap-4 md:gap-6">
              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                  <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'}`}>
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{configTab === 'categorias' ? t(common.expenses) : t(common.income)}</p>
                      <p className={`${'text-lg md:text-2xl font-semibold'}`}>{formatCurrency(configTab === 'categorias' ? totalDespesas : totalReceitas)}</p>
                    </div>
                  </div>
                </div>

                <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-3'}`}>{t(dashboard.monthlyBalance)}</h2>
                  <div className="w-full h-[180px] sm:h-[220px] md:h-[260px]">
                    {monthlyBalanceData.every(item => item.balance === 0) ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
                        <p className="text-sm text-center">{t(common.noData)}</p>
                      </div>
                    ) : (
                      /* RF09 - A tela de Painel deve exibir ao usuário gráficos de Saldo mensal e Despesas por Categoria ou Receitas por Fonte. */
                      <BalanceChart data={monthlyBalanceData} moeda={user?.moeda ?? "real"} />
                    )}
                  </div>
                </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm min-h-[200px] md:min-h-[300px]`}>
                  {configTab === 'categorias' ? (
                    despesasChartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                        <PieChart className="w-12 h-12 mb-4 text-gray-300" />
                        <p>{t(dashboard.noExpenses)}</p>
                        <p className="text-sm mt-2">{t(dashboard.addExpense)}</p>
                      </div>
                    ) : (
                      /* RF09 - A tela de Painel deve exibir ao usuário gráficos de Saldo mensal e Despesas por Categoria ou Receitas por Fonte. */
                      <DespesasChart data={despesasChartData} moeda={user?.moeda ?? "real"} />
                    )
                  ) : (
                    receitasChartData.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                        <PieChart className="w-12 h-12 mb-4 text-gray-300" />
                        <p>{t(dashboard.noIncome)}</p>
                        <p className="text-sm mt-2">{t(dashboard.addIncome)}</p>
                      </div>
                    ) : (
                      /* RF09 - A tela de Painel deve exibir ao usuário gráficos de Saldo mensal e Despesas por Categoria ou Receitas por Fonte. */
                      <ReceitasChart data={receitasChartData} moeda={user?.moeda ?? "real"} />
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
        <header className={`flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4 ${''}`}>
        <h1 className={`${'text-xl md:text-2xl font-semibold text-gray-800 text-center md:text-left'}`}>{t(dashboard.title)}</h1>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`${'px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-48'}`}
            >
              {monthOptions.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <button
              onClick={openModal}
          className={`bg-blue-600 text-white px-4 py-2 font-bold rounded-md text-sm hover:bg-blue-700 transition w-full md:w-48 whitespace-nowrap flex items-center justify-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              {activeTab === 'despesas' ? t(dashboard.addExpense) : t(dashboard.addIncome)}
            </button>
          </div>
        </header>

    <div className={`relative flex ${'bg-white'} rounded-lg w-fit mb-6 md:mb-8`}>
          <div className={`absolute top-0 h-full bg-blue-600 rounded-lg transition-all duration-200 ease-in-out ${
            activeTab === 'despesas' ? 'left-0 w-1/2' : 'left-1/2 w-1/2'
          }`}></div>
          <button 
            onClick={() => setActiveTab('despesas')}
            className={`relative z-10 px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === 'despesas' ? ('text-white') : ('text-gray-600')}`}
          >
            {t(dashboard.expensesTab)}
          </button>
          <button
            onClick={() => setActiveTab('receitas')}
            className={`relative z-10 px-6 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeTab === 'receitas' ? ('text-white') : ('text-gray-600')}`}
          >
            {t(dashboard.incomeTab)}
          </button>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
          <div className="w-full xl:w-4/6 flex flex-col gap-4 md:gap-6">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-2 md:gap-3">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center'}`}>
                      <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.expenses)}</p>
                      <p className={`${'text-lg md:text-2xl font-semibold'}`}>{formatCurrency(totalDespesas)}</p>
                    </div>
                  </div>
                </div>
              </div>

          <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'}`}>
                    <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  </div>
                  <div>
                <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.income)}</p>
                <p className={`${'text-lg md:text-2xl font-semibold'}`}>{formatCurrency(totalReceitas)}</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfigTab(activeTab === 'despesas' ? 'categorias' : 'fontes')
                  setShowConfigView(true)
                }}
            className={`flex items-center gap-2 ${'text-gray-600 hover:text-gray-800'} transition-colors`}
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-sm">{activeTab === 'despesas' ? t(dashboard.configureCategories) : t(dashboard.configureSources)}</span>
              </button>
            </div>

            {/* RF15 - O sistema deverá ter na tela de Painel, filtros de: ordem de listagem, busca por nome, busca por valor mínimo e máximo, seleção de categoria ou fonte. */}
            <section className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800'}`}>{activeTab === 'despesas' ? `${t(dashboard.lastExpenses)}` : `${t(dashboard.lastIncome)}`}</h2>
              </div>
              
              <div className={`mb-4 p-4 rounded-lg ${'bg-gray-50 border border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${'text-gray-500'}`} />
                    <input
                      type="text"
                      placeholder={t(common.search)}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2 text-sm rounded-md border ${
                        'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      } focus:outline-none`}
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder={t(common.minValue)}
                      value={minValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,.-]/g, '')
                        setMinValue(value)
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-md border ${
                        'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      } focus:outline-none`}
                    />
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder={t(common.maxValue)}
                      value={maxValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d,.-]/g, '')
                        setMaxValue(value)
                      }}
                      className={`w-full px-3 py-2 text-sm rounded-md border ${
                        'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      } focus:outline-none`}
                    />
                  </div>
                  
                  <div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className={`w-full px-3 py-2 text-sm rounded-md border ${
                        'bg-white border-gray-300 text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                      } focus:outline-none`}
                    >
                      <option value="all">{activeTab === 'despesas' ? t(common.allCategories) : t(common.allSources)}</option>
                      {(activeTab === 'despesas' ? categorias : fontes).map((item) => (
                        <option key={item.id} value={item.id.toString()}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="md:hidden">
                {filteredRows.length === 0 ? (
                  <div className={`text-center py-12 ${'text-gray-500'}`}>
                    {activeTab === 'despesas' ? (
                      <ShoppingCart className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    ) : (
                      <CreditCard className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    )}
                    <p>{activeTab === 'despesas' ? t(dashboard.noExpenses) : t(dashboard.noIncome)}</p>
                    <p className="text-sm mt-2">{activeTab === 'despesas' ? t(dashboard.addExpense) : t(dashboard.addIncome)}</p>
                  </div>
                ) : (
                  <>
                    <div className={`grid grid-cols-4 gap-2 pb-2 mb-2 border-b ${'border-gray-200'} text-xs ${'text-gray-500'} font-medium`}>
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1"
                        onClick={(e) => { e.stopPropagation(); handleSort('date'); }}
                      >
                        {t(common.date)}
                        {sortColumn === 'date' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                      <div 
                        className="col-span-2 cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center gap-1"
                        onClick={(e) => { e.stopPropagation(); handleSort('name'); }}
                      >
                        {t(common.name)}
                        {sortColumn === 'name' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                      <div 
                        className="text-right cursor-pointer hover:opacity-80 transition-opacity select-none flex items-center justify-end gap-1"
                        onClick={(e) => { e.stopPropagation(); handleSort('value'); }}
                      >
                        {t(common.value)}
                        {sortColumn === 'value' && (
                          sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {paginatedRows.map((row) => (
                        <div
                          key={row.id}
                          className={`${'bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100'} transition-colors cursor-pointer grid grid-cols-4 gap-2 items-center`}
                          onClick={() => openEditModal(row)}
                        >
                          <div className="text-xs font-medium">{row.date}</div>
                          <div className="col-span-2 flex items-center gap-2 min-w-0">
                            <span className="flex-shrink-0">{row.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{row.name}</div>
                              <div className={`${'text-xs text-gray-500 truncate'}`}>{row.category}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">{row.value}</div>
                            <div className={`text-xs ${activeTab === 'despesas' ? 'text-orange-600' : 'text-green-600'}`}>{row.saldo}</div>
                          </div>
                        </div>
                      ))}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4 pt-2 border-t border-gray-100/10">
                          <button
                            onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1); }}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {t(common.previous)}
                          </button>
                          <span className={`text-xs ${'text-gray-600'}`}>
                            {currentPage} {t(common.of)} {totalPages}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1); }}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                          >
                            {t(common.next)}
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                {filteredRows.length === 0 ? (
                  <div className={`text-center py-12 ${'text-gray-500'}`}>
                    {activeTab === 'despesas' ? (
                      <ShoppingCart className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    ) : (
                      <CreditCard className={`w-12 h-12 mx-auto mb-4 ${'text-gray-300'}`} />
                    )}
                    <p>{activeTab === 'despesas' ? t(dashboard.noExpenses) : t(dashboard.noIncome)}</p>
                    <p className="text-sm mt-2">{activeTab === 'despesas' ? t(dashboard.clickToAddExpense) : t(dashboard.clickToAddIncome)}</p>
                  </div>
                ) : (
                  <>
                  <table className="w-full text-xs md:text-sm table-fixed min-w-[500px]">
                    <thead className={`${'text-gray-500'}`}>
                      <tr>
                        <th 
                          className="py-1 md:py-2 font-medium text-left w-16 pl-3 md:pl-4 cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={(e) => { e.stopPropagation(); handleSort('date'); }}
                        >
                          <div className="flex items-center gap-1">
                            {t(common.date)}
                            {sortColumn === 'date' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 md:py-2 font-medium text-left w-1/3 cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={(e) => { e.stopPropagation(); handleSort('name'); }}
                        >
                          <div className="flex items-center gap-1">
                            {t(common.name)}
                            {sortColumn === 'name' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 md:py-2 font-medium text-left w-24 cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={(e) => { e.stopPropagation(); handleSort('value'); }}
                        >
                          <div className="flex items-center gap-1">
                            {t(common.value)}
                            {sortColumn === 'value' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="py-1 md:py-2 font-medium text-left w-1/4 cursor-pointer hover:opacity-80 transition-opacity select-none"
                          onClick={(e) => { e.stopPropagation(); handleSort('category'); }}
                        >
                          <div className="flex items-center gap-1">
                            {activeTab === 'despesas' ? t(common.category) : t(common.source)}
                            {sortColumn === 'category' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="py-1 md:py-2 font-medium text-left w-24">{t(common.total)}</th>
                      </tr>
                    </thead>
                    <tbody className={`${'text-gray-700'}`}>
                      {paginatedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`${'odd:bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'}`}
                          onClick={() => openEditModal(row)}
                        >
                          <td className="py-2 md:py-3 pl-3 md:pl-4 align-middle">{row.date}</td>
                          <td className="py-2 md:py-3 align-middle">
                            <div className="flex items-center gap-1 md:gap-2">
                              <span className="flex-shrink-0">{row.icon}</span>
                              <span className="truncate text-xs md:text-sm">{row.name}</span>
                            </div>
                          </td>
                          <td className="py-2 md:py-3 align-middle text-xs md:text-sm">{row.value}</td>
                          <td className="py-2 md:py-3 align-middle truncate text-xs md:text-sm">{row.category}</td>
                          <td className={`py-2 md:py-3 align-middle ${activeTab === 'despesas' ? 'text-orange-600' : 'text-green-600'} text-xs md:text-sm`}>{row.saldo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); goToPage(currentPage - 1); }}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {t(common.previous)}
                      </button>
                      <span className={`text-sm ${'text-gray-600'}`}>
                        {currentPage} {t(common.of)} {totalPages}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); goToPage(currentPage + 1); }}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                      >
                        {t(common.next)}
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </section>
          </div>
          
          <div className="w-full xl:w-2/6 flex flex-col gap-4 md:gap-6">
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-3'}`}>{t(dashboard.monthlyBalance)}</h2>
              <div className="w-full h-[180px] sm:h-[220px] md:h-[260px]">
                {monthlyBalanceData.every(item => item.balance === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm text-center">{t(common.noData)}</p>
                  </div>
                ) : (
                  <BalanceChart data={monthlyBalanceData} moeda={user?.moeda ?? "real"} />
                )}
              </div>
            </div>
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm min-h-[200px] md:min-h-[300px]`}>
              {activeTab === 'despesas' ? (
                despesasChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <PieChart className="w-12 h-12 mb-4 text-gray-300" />
                    <p>{t(dashboard.noExpensesChart)}</p>
                  </div>
                ) : (
                  <DespesasChart data={despesasChartData} moeda={user?.moeda ?? "real"} />
                )
              ) : (
                receitasChartData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <PieChart className="w-12 h-12 mb-4 text-gray-300" />
                    <p>{t(dashboard.noIncomeChart)}</p>
                  </div>
                ) : (
                  <ReceitasChart data={receitasChartData} moeda={user?.moeda ?? "real"} />
                )
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      <AddDashboardModal isOpen={isModalOpen} onClose={closeModal} type={activeTab} />
      
      {selectedItem && (
        <EditDashboardModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          type={activeTab}
          editItem={{
            id: selectedItem.id,
            name: selectedItem.name,
            category: selectedItem.category,
            categoryId: selectedItem.categoryId,
            value: selectedItem.value,
            recurring: selectedItem.recurring,
            date: convertDateForEditModal(selectedItem.date, selectedItem.displayMonth),
            originalId: selectedItem.originalId,
            displayMonth: selectedItem.displayMonth
          }}
          onDelete={handleDelete}
          moeda ={user?.moeda ?? "real"}
        />
      )}

      {isConfigModalOpen && !selectedConfigItem && (
        <AddCategoriaModal
          isOpen={isConfigModalOpen}
          onClose={closeConfigModal}
          type={configTab}
        />
      )}

      {isConfigModalOpen && selectedConfigItem && (
        <EditCategoriaModal
          isOpen={isConfigModalOpen}
          onClose={closeConfigModal}
          type={configTab}
          item={selectedConfigItem}
          onDelete={handleConfigDelete}
        />
      )}
      </div>
    </ProtectedRoute>
  )
}