import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Store,
  ShoppingCart,
  Package,
  Tags,
  Receipt,
  BarChart3,
  Settings,
  Users,
  Percent,
  CreditCard,
  Printer,
  Barcode,
  PauseCircle,
  LogOut,
  Shield,
  User,
  ChevronDown,
  LayoutDashboard,
  ShoppingBag,
  FileText,
  Calculator
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

interface NavGroup {
  label: string
  icon: React.ElementType
  items: NavItem[]
  adminOnly?: boolean
}

const navGroups: NavGroup[] = [
  {
    label: 'Sales Operations',
    icon: ShoppingBag,
    items: [
      { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
      { id: 'held-sales', label: 'Held Sales', icon: PauseCircle },
    ],
  },
  {
    label: 'Inventory',
    icon: Package,
    adminOnly: true,
    items: [
      { id: 'products', label: 'Products', icon: Package },
      { id: 'categories', label: 'Categories', icon: Tags },
      { id: 'barcodes', label: 'Barcodes', icon: Barcode },
    ],
  },
  {
    label: 'Finance',
    icon: Calculator,
    adminOnly: true,
    items: [
      { id: 'sales', label: 'Sales History', icon: Receipt },
      { id: 'discounts', label: 'Discounts', icon: Percent },
      { id: 'mpesa', label: 'MPesa', icon: CreditCard },
    ],
  },
  {
    label: 'Reports & Analytics',
    icon: BarChart3,
    adminOnly: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'System',
    icon: Settings,
    adminOnly: true,
    items: [
      { id: 'users', label: 'Users', icon: Users },
      { id: 'printers', label: 'Printers', icon: Printer },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
]

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'Sales Operations',
  ])

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) =>
      prev.includes(label)
        ? prev.filter((g) => g !== label)
        : [...prev, label]
    )
  }

  const isItemActive = (id: string) => currentPage === id
  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => item.id === currentPage)

  return (
    <div className="w-72 h-full flex flex-col border-r bg-gray-100/2 text-gray-900 shadow-xl">
      {/* Logo */}
      <div className="p-5 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-primary rounded-none flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">POS Pro</h1>
            <p className="text-xs text-gray-500">Point of Sale System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-2">
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null

            const GroupIcon = group.icon
            const isExpanded = expandedGroups.includes(group.label)
            const activeGroup = isGroupActive(group)

            return (
              <div key={group.label}>
                {/* Group Header */}
                <Button
                  variant="ghost"
                  onClick={() => toggleGroup(group.label)}
                  className={`
                    w-full px-4 py-3 flex items-center justify-between rounded-none
                    text-sm font-semibold text-gray-800
                    ${activeGroup ? 'bg-primary shadow-sm border hover:bg-primary hover:text-white text-white' : 'hover:bg-gray-200'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-none flex items-center justify-center py-2
                        ${
                          activeGroup
                            ? ''
                            : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      <GroupIcon className="w-4 h-4 text-w my-2" />
                    </div>
                    <span>{group.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      isExpanded ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </Button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const active = isItemActive(item.id)

                      return (
                        <button
                          key={item.id}
                          onClick={() => onPageChange(item.id)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2 rounded-none text-sm
                            transition-all
                            ${
                              active
                                ? 'bg-primary text-white shadow'
                                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                            }
                          `}
                        >
                          <Icon className="w-4 h-4 text-current" />
                          <span>{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center
              ${
                isAdmin
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
          >
            {isAdmin ? (
              <Shield className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={logout}
          className="w-full text-gray-800 hover:bg-red-600 hover:text-white"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
