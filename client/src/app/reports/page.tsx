'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { reports } from '@/app/terminology/language/reports'
import ExportDataTab from './_components/ExportDataTab'
import ImportDataTab from './_components/ImportDataTab'
import ExportGraphsTab from './_components/ExportGraphsTab'

type Tab = 'export' | 'import' | 'graphs'

export default function ReportsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<Tab>('export')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'export', label: t(reports.exportData) },
    { key: 'import', label: t(reports.importData) },
    { key: 'graphs', label: t(reports.exportGraphs) },
  ]

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 md:ml-64">
          <header className="mb-6">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              {t(reports.title)}
            </h1>
          </header>

          <div className="mb-6">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeTab === 'export' && <ExportDataTab />}
            {activeTab === 'import' && <ImportDataTab />}
            {activeTab === 'graphs' && <ExportGraphsTab />}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
