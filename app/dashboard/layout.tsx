'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Truck,
  Map,
  Star,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Plug
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Dispatch', href: '/dashboard/dispatch', icon: Truck },
  { name: 'Orders', href: '/dashboard/orders', icon: Package },
  { name: 'Riders', href: '/dashboard/riders', icon: Users },
  { name: 'Map', href: '/dashboard/map', icon: Map },
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { 
    name: 'Reports', 
    icon: BarChart3,
    submenu: [
      { name: 'Sales', href: '/dashboard/reports/sales' },
      { name: 'Drivers', href: '/dashboard/reports/drivers' },
      { name: 'Performance', href: '/dashboard/reports/performance' },
      { name: 'Extended', href: '/dashboard/reports/extended' },
      { name: 'Analytics', href: '/dashboard/reports/analytics' },
      { name: 'Heatmap', href: '/dashboard/reports/heatmap' },
      { name: 'Third Party', href: '/dashboard/reports/third-party' },
      { name: 'Refund', href: '/dashboard/reports/refund' },
      { name: 'Customers', href: '/dashboard/reports/customers' },
    ]
  },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Plug },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Reports'])
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    )
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
      } else {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      alert('Logged out successfully')
      router.push('/login')
    } catch (error) {
      alert('Failed to logout')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Deliverly</span>
            </div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              if ('submenu' in item && item.submenu) {
                const isExpanded = expandedMenus.includes(item.name)
                const isActive = pathname?.startsWith('/dashboard/reports')
                const Icon = item.icon
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium
                        transition-colors
                        ${isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {item.name}
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {isExpanded && item.submenu && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={`
                                block px-3 py-2 rounded-md text-sm
                                transition-colors
                                ${isSubActive 
                                  ? 'bg-primary text-primary-foreground font-medium' 
                                  : 'text-gray-600 hover:bg-gray-100'
                                }
                              `}
                              onClick={() => setSidebarOpen(false)}
                            >
                              {subItem.name}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }
              
              const Icon = item.icon!
              const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/dashboard')
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                    transition-colors
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="ml-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Deliverly</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
