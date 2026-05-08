'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Goal, LineChart, Settings, SquareStack, LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { sidebar } from '@/app/terminology/language/sidebar'
import { common } from '@/app/terminology/language/common'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const handleLogout = () => setShowLogoutModal(true)
  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }
  const cancelLogout = () => setShowLogoutModal(false)

  const initials = user?.nome
    ? user.nome.split(' ').map(word => word[0]).join('').toUpperCase()
    : 'JS'

  const links = [
    { name: t(sidebar.dashboard), href: '/dashboard', icon: <SquareStack className="w-5 h-5" /> },
    { name: t(sidebar.goals), href: '/metas', icon: <Goal className="w-5 h-5" /> },
    { name: t(sidebar.analysis), href: '/analise', icon: <LineChart className="w-5 h-5" /> },
    { name: t(sidebar.settings), href: '/configuracoes', icon: <Settings className="w-5 h-5" /> }
  ]

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md shadow transition bg-white text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 flex flex-col justify-between
          transform transition-transform duration-300 z-40 overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          bg-white text-gray-800
        `}
      >

        <div>
          <div className="flex items-center gap-3 p-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">{initials}</span>
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium">{user?.nome || 'Carregando...'}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-1 rounded transition hover:bg-gray-100"
              title={t(sidebar.logout)}
            >
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <nav className="mt-4">
            {links.map(link => {
              const active = pathname === link.href

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors 
                    ${active
                      ? "text-gray-800 bg-gradient-to-r from-blue-100 to-white"
                      : "text-gray-600 hover:bg-gray-50"
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="max-w-sm w-full mx-4 p-6 rounded-lg shadow-lg transition bg-white text-gray-800"
          >
            <h3 className="text-lg font-semibold mb-2">{t(sidebar.logoutConfirmTitle)}</h3>
            <p className="text-sm opacity-80 mb-6">{t(sidebar.logoutConfirmMessage)}</p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium transition bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                {t(common.cancel)}
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition bg-indigo-600 hover:bg-indigo-700"
              >
                {t(sidebar.logout)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
