"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Package, TrendingUp, User, MapPin, Receipt, Archive } from "lucide-react"

interface BottomNavigationProps {
  userType: "customer" | "collector"
}

export function BottomNavigation({ userType }: BottomNavigationProps) {
  const pathname = usePathname()

  const customerNavItems = [
    { href: "/customer/dashboard", icon: Home, label: "Beranda" },
    { href: "/customer/sell", icon: Package, label: "Jual" },
    { href: "/customer/prices", icon: TrendingUp, label: "Harga" },
    { href: "/customer/transactions", icon: Receipt, label: "Transaksi" },
    { href: "/customer/profile", icon: User, label: "Profil" },
  ]

  const collectorNavItems = [
    { href: "/collector/dashboard", icon: Home, label: "Beranda" },
    { href: "/collector/map", icon: MapPin, label: "Peta" },
    { href: "/collector/transactions", icon: Receipt, label: "Transaksi" },
    { href: "/collector/inventory", icon: Archive, label: "Inventory" },
    { href: "/collector/profile", icon: User, label: "Profil" },
  ]

  const navItems = userType === "customer" ? customerNavItems : collectorNavItems

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
