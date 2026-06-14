'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Goal, LineChart, Settings, SquareStack, LogOut, Menu, FileText, Heart, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/app/terminology/LanguageContext'
import { sidebar } from '@/app/terminology/language/sidebar'
import { common } from '@/app/terminology/language/common'
import { reports } from '@/app/terminology/language/reports'

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(false)
  const [lifeOpen, setLifeOpen] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useLanguage()

  const handleLogout = () => setShowLogoutModal(true)
  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }
  const cancelLogout = () => setShowLogoutModal(false)

  const initials = user?.name
    ? user.name.split(' ').map(word => word[0]).join('').toUpperCase()
    : 'JS'

  const sections = [
    {
      name: t(sidebar.finance),
      open: financeOpen,
      setOpen: () => setFinanceOpen(!financeOpen),
      items: [
        { name: t(sidebar.dashboard), href: '/dashboard', icon: <SquareStack className="w-5 h-5" /> },
        { name: t(sidebar.goals), href: '/goals', icon: <Goal className="w-5 h-5" /> },
        { name: t(sidebar.analysis), href: '/analysis', icon: <LineChart className="w-5 h-5" /> },
        { name: t(sidebar.wishlist), href: '/wishlist', icon: <Heart className="w-5 h-5" /> },
        { name: t(reports.sidebar), href: '/reports', icon: <FileText className="w-5 h-5" /> },
      ],
    },
    {
      name: t(sidebar.life),
      open: lifeOpen,
      setOpen: () => setLifeOpen(!lifeOpen),
      items: [
        { name: t(sidebar.soon), href: null, icon: null },
      ],
    },
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
              <p className="text-sm font-medium">{user?.name || 'Loading...'}</p>
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
            {sections.map((section) => (
              <div key={section.name}>
                <button
                  onClick={section.setOpen}
                  className="w-full flex items-center gap-2 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${section.open ? 'rotate-0' : '-rotate-90'}`}
                  />
                  {section.name}
                </button>
                {section.open && (
                  <div>
                    {section.items.map((item) => {
                      if (item.href === null) {
                        return (
                          <span
                            key={item.name}
                            className="flex items-center gap-3 px-6 py-3 text-sm text-gray-400"
                          >
                            {item.name}
                          </span>
                        )
                      }

                      const active = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors 
                            ${active
                              ? "text-gray-800 bg-gradient-to-r from-blue-100 to-white"
                              : "text-gray-600 hover:bg-gray-50"
                            }
                          `}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <Link
                href="/settings"
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors 
                  ${pathname === '/settings'
                    ? "text-gray-800 bg-gradient-to-r from-blue-100 to-white"
                    : "text-gray-600 hover:bg-gray-50"
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-5 h-5" />
                {t(sidebar.settings)}
              </Link>
            </div>
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
