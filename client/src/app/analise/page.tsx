'use client'

import { useState, useEffect, useMemo } from 'react'
import Sidebar from '@/components/sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { TrendingUp, TrendingDown, Target, DollarSign, PieChart, BarChart3, Calendar, Activity } from 'lucide-react'
import { Despesa, Receita, Meta, DespesaExclusao, ReceitaExclusao } from '@/types'
import { despesasService, receitasService, metasService, despesasExclusaoService, receitasExclusaoService, ApiError } from '@/services'
import { formatCurrency as formatMoney } from "@/app/terminology/currency"
import { useAuth } from "@/contexts/AuthContext"
import YearlyBalanceChart from '@/components/YearlyBalanceChart'
import MonthlyTrendChart from '@/components/MonthlyTrendChart'
import GoalAllocationChart from '@/components/GoalAllocationChart'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { analise } from '@/app/terminology/language/analise'
import { common } from '@/app/terminology/language/common'

export default function AnalisePage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [metas, setMetas] = useState<Meta[]>([])
  const [despesasExclusoes, setDespesasExclusoes] = useState<DespesaExclusao[]>([])
  const [receitasExclusoes, setReceitasExclusoes] = useState<ReceitaExclusao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setCarregando(true)
        setErro(null)
        const [despesasResponse, receitasResponse, metasResponse, despesasExclusoesResponse, receitasExclusoesResponse] = await Promise.all([
          despesasService.getAll(1, 2000),
          receitasService.getAll(1, 2000),
          metasService.getAll(1, 2000),
          despesasExclusaoService.getAll(),
          receitasExclusaoService.getAll()
        ])

        const despesasData = Array.isArray(despesasResponse)
          ? despesasResponse
          : (despesasResponse?.data || [])
        const receitasData = Array.isArray(receitasResponse)
          ? receitasResponse
          : (receitasResponse?.data || [])
        const metasData = Array.isArray(metasResponse)
          ? metasResponse
          : (metasResponse?.data || [])

        setDespesas(despesasData)
        setReceitas(receitasData)
        setMetas(metasData)
        setDespesasExclusoes(despesasExclusoesResponse)
        setReceitasExclusoes(receitasExclusoesResponse)
      } catch (err) {
        const error = err as ApiError;
        if (error && (error.status === 401 || error.status === 403)) {
          setCarregando(false);
          return;
        }
        console.error('Erro ao buscar dados:', err)
        setErro(t(analise.errorLoadingAnalysis))
      } finally {
        setCarregando(false)
      }
    }

    fetchData()
  }, [t, user])

  const formatCurrency = (value: number) => {
    return formatMoney(value, user?.moeda || "real")
  }

  // RN18 - O sistema armazenará Despesas e Receitas recorrentes como um único registro no banco, e usará uma função de expansão para exibir os registros mensais.
  const expandirEntradasRecorrentes = <T extends Despesa | Receita>(
    itens: T[],
    mesSelecionado: string,
    exclusoes: (DespesaExclusao | ReceitaExclusao)[]
  ): T[] => {
    if (!mesSelecionado) return itens

    const [mes, ano] = mesSelecionado.split('-')
    const dataAlvo = new Date(parseInt(ano), parseInt(mes) - 1, 1)

    const itensExpandidos: T[] = []

    itens.forEach(item => {
      const dataInicioItem = new Date(item.data)
      const anoInicioItem = dataInicioItem.getFullYear()
      const mesInicioItem = dataInicioItem.getMonth()
      const inicioMesItem = new Date(anoInicioItem, mesInicioItem, 1)

      if (item.recorrente) {
        // RN20 - Receitas e Despesas recorrentes sem uma data de vencimento definida são exibidas indefinidamente mês a mês.
        const anoAlvo = dataAlvo.getFullYear()
        const mesAlvo = dataAlvo.getMonth()
        const inicioMesAlvo = new Date(anoAlvo, mesAlvo, 1)

        if (inicioMesItem <= inicioMesAlvo) {
          let dentroPrazo = true
          if (item.data_vencimento) {
            const dataFim = new Date(item.data_vencimento)
            const anoFim = dataFim.getFullYear()
            const mesFim = dataFim.getMonth()
            const inicioMesFim = new Date(anoFim, mesFim, 1)
            dentroPrazo = inicioMesAlvo <= inicioMesFim
          }

          if (dentroPrazo) {
            const chaveMes = `${ano}-${mes}-01`
            // RN19 - A expansão de Despesas e Receitas recorrentes utilizará as tabelas de Exclusão de Receita e Exclusão de Despesa para remover registros de cálculos, exibições, gráficos e Análise.
            const foiExcluido = exclusoes.some(exc => {
              const ehDespesa = 'despesa_id' in exc
              const idItem = ehDespesa ? (exc as DespesaExclusao).despesa_id : (exc as ReceitaExclusao).receita_id
              const dataExc = new Date(exc.data_exclusao)
              const anoExc = dataExc.getFullYear()
              const mesExc = String(dataExc.getMonth() + 1).padStart(2, '0')
              const chaveExc = `${anoExc}-${mesExc}-01`

              return idItem === item.id && chaveExc === chaveMes
            })

            if (!foiExcluido) {
              const entradaVirtual = { ...item }
              itensExpandidos.push(entradaVirtual)
            }
          }
        }
      } else {
        const mesItem = String(dataInicioItem.getMonth() + 1).padStart(2, '0')
        const anoItem = dataInicioItem.getFullYear().toString()
        if (mesItem === mes && anoItem === ano) {
          itensExpandidos.push(item)
        }
      }
    })

    return itensExpandidos
  }

  const dadosBalancoAnual = useMemo(() => {
    const balancos = []
    const agora = new Date()

    for (let i = 11; i >= 0; i--) {
      const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
      const mes = String(data.getMonth() + 1).padStart(2, '0')
      const ano = data.getFullYear()
      const chaveMes = `${mes}-${ano}`

      const despesasMes = expandirEntradasRecorrentes(despesas, chaveMes, despesasExclusoes)
      const receitasMes = expandirEntradasRecorrentes(receitas, chaveMes, receitasExclusoes)

      const totalReceitasMes = receitasMes.reduce((soma, r) => soma + (Number(r.valor) || 0), 0)
      const totalDespesasMes = despesasMes.reduce((soma, d) => soma + (Number(d.valor) || 0), 0)
      const balanco = totalReceitasMes - totalDespesasMes

      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const rotuloMes = `${nomesMeses[data.getMonth()]} ${ano}`

      balancos.push({
        month: rotuloMes,
        balance: balanco,
        receitas: totalReceitasMes,
        despesas: totalDespesasMes
      })
    }

    return balancos
  }, [despesas, receitas, despesasExclusoes, receitasExclusoes])

  const balancoMedio = useMemo(() => {
    const total = dadosBalancoAnual.reduce((soma, item) => soma + item.balance, 0)
    return total / dadosBalancoAnual.length
  }, [dadosBalancoAnual])

  const totaisAnuais = useMemo(() => {
    const totalReceitas = dadosBalancoAnual.reduce((soma, item) => soma + item.receitas, 0)
    const totalDespesas = dadosBalancoAnual.reduce((soma, item) => soma + item.despesas, 0)
    return { totalReceitas, totalDespesas }
  }, [dadosBalancoAnual])

  const receitaMediaMensal = useMemo(() => {
    return totaisAnuais.totalReceitas / 12
  }, [totaisAnuais])

  const alocacaoReceitaMetas = useMemo(() => {
    if (receitaMediaMensal === 0) return 0
    const totalAlocacaoMensalMetas = metas.reduce((soma, meta) => soma + (Number(meta.economia_mensal) || 0), 0)
    return (totalAlocacaoMensalMetas / receitaMediaMensal) * 100
  }, [metas, receitaMediaMensal])

  const taxaAlcanceMetas = useMemo(() => {
    const alocacaoEsperadaTotal = metas.reduce((soma, meta) => soma + (Number(meta.economia_mensal) || 0), 0) * 6

    if (alocacaoEsperadaTotal === 0) return 0

    const alocacaoRealTotal = metas.reduce((soma, meta) => soma + (Number(meta.valor_atual) || 0), 0)

    return (alocacaoRealTotal / alocacaoEsperadaTotal) * 100
  }, [metas])

  const taxaPoupanca = useMemo(() => {
    if (receitaMediaMensal === 0) return 0
    const despesaMedia = totaisAnuais.totalDespesas / 12
    return ((receitaMediaMensal - despesaMedia) / receitaMediaMensal) * 100
  }, [receitaMediaMensal, totaisAnuais])

  const tendenciaBalanco = useMemo(() => {
    if (dadosBalancoAnual.length < 2) return 'stable'
    const ultimos3 = dadosBalancoAnual.slice(-3)
    const anteriores3 = dadosBalancoAnual.slice(-6, -3)

    const mediaRecente = ultimos3.reduce((soma, item) => soma + item.balance, 0) / ultimos3.length
    const mediaAnterior = anteriores3.reduce((soma, item) => soma + item.balance, 0) / anteriores3.length

    if (mediaRecente > mediaAnterior * 1.1) return 'up'
    if (mediaRecente < mediaAnterior * 0.9) return 'down'
    return 'stable'
  }, [dadosBalancoAnual])

  if (carregando) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center ${''}`}>
            <div className={`${'text-gray-500'}`}>{t(analise.loadingAnalysis)}</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (erro) {
    return (
      <ProtectedRoute>
        <div className={`flex min-h-screen ${'bg-gray-50'}`}>
          <Sidebar />
          <main className={`flex-1 p-4 md:p-8 md:ml-64 flex items-center justify-center ${''}`}>
            <div className="text-red-500">{erro}</div>
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
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4">
            <h1 className={`${'text-xl md:text-2xl font-semibold text-gray-800 text-center md:text-left'}`}>
              {t(analise.title)}
            </h1>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
            {/* RF14 - A tela de Análise deverá exibir dados dos últimos 12 meses de: Saldo médio mensal, taxa de economia, alocação de metas, porcentagem de conclusão de metas, total de receitas, total de despesas, receita média mensal, evolução do saldo, receitas e despesas (comparação), alocação de metas (gráfico de pizza) e resumo das metas (lista). */}
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  {tendenciaBalanco === 'up' ? (
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  ) : tendenciaBalanco === 'down' ? (
                    <TrendingDown className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analise.averageMonthlyBalance)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'} ${balancoMedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balancoMedio)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <PieChart className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analise.savingsRate)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {taxaPoupanca.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <Target className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analise.goalAllocation)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {alocacaoReceitaMetas.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analise.goalAchievementRate)}</p>
                  <p className={`${'text-lg md:text-2xl font-semibold'}`}>
                    {taxaAlcanceMetas.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.total)} {t(analise.income)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(totaisAnuais.totalReceitas)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(common.total)} {t(analise.expenses)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(totaisAnuais.totalDespesas)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <div className={`${'w-8 h-8 md:w-10 md:h-10 bg-green-100 rounded-full flex items-center justify-center'} flex-shrink-0`}>
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                </div>
                <div>
                  <p className={`${'text-gray-500 text-xs md:text-sm'}`}>{t(analise.incomeMonthlyAverage)}</p>
                  <p className={`${'text-lg md:text-xl font-semibold'}`}>
                    {formatCurrency(receitaMediaMensal)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col xl:flex-row gap-4 md:gap-6">
            <div className="w-full xl:w-2/3 flex flex-col gap-4 md:gap-6">
              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analise.yearlyBalance)} {t(analise.monthsLabel)}
                </h2>
                <div className="w-full h-[300px]">
                  {dadosBalancoAnual.every(item => item.balance === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <TrendingUp className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm text-center">{t(analise.noDataAvailable)}</p>
                    </div>
                  ) : (
                    <YearlyBalanceChart data={dadosBalancoAnual} moeda={user?.moeda ?? "real"} />
                  )}
                </div>
              </div>

              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analise.income)} vs {t(analise.expenses)} {t(analise.monthsLabel)}
                </h2>
                <div className="w-full h-[300px]">
                  {dadosBalancoAnual.every(item => item.receitas === 0 && item.despesas === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <BarChart3 className="w-10 h-10 mb-3 text-gray-300" />
                      <p className="text-sm text-center">{t(analise.noDataAvailable)}</p>
                    </div>
                  ) : (
                    <MonthlyTrendChart data={dadosBalancoAnual} moeda={user?.moeda ?? "real"} />
                  )}
                </div>
              </div>
            </div>

            <div className="w-full xl:w-1/3 flex flex-col gap-4 md:gap-6">
              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm min-h-[300px]`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analise.goalAllocation)}
                </h2>
                {metas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                    <Target className="w-12 h-12 mb-4 text-gray-300" />
                    <p className="text-sm text-center">{t(analise.noDataAvailable)}</p>
                  </div>
                ) : (
                  <GoalAllocationChart metas={metas} moeda={user?.moeda ?? "real"} />
                )}
              </div>

              <div className={`${'bg-white text-gray-800'} p-4 md:p-6 rounded-xl shadow-sm`}>
                <h2 className={`${'text-base md:text-lg font-semibold text-gray-800 mb-4'}`}>
                  {t(analise.goalSummary)}
                </h2>
                {metas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Target className="w-10 h-10 mb-3 text-gray-300" />
                    <p className="text-sm text-center">{t(analise.noDataAvailable)}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {metas.map((meta) => {
                      const progresso = Number(meta.valor) > 0 ? (Number(meta.valor_atual) / Number(meta.valor)) * 100 : 0
                      return (
                        <div key={meta.id} className={`p-3 rounded-lg ${'bg-gray-50'}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-medium ${'text-gray-800'}`}>{meta.nome}</span>
                            <span className={`text-xs ${'text-gray-500'}`}>{progresso.toFixed(0)}%</span>
                          </div>
                          <div className={`w-full rounded-full h-2 ${'bg-gray-200'}`}>
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progresso, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-xs ${'text-gray-500'}`}>
                              {formatCurrency(Number(meta.valor_atual) || 0)}
                            </span>
                            <span className={`text-xs ${'text-gray-500'}`}>
                              {formatCurrency(Number(meta.valor) || 0)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
