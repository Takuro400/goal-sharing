'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Kanban, FileText, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/vision', label: 'ビジョン', icon: Target },
  { href: '/board', label: 'カンバン', icon: Kanban },
  { href: '/memo', label: 'メモ', icon: FileText },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white md:hidden">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
            pathname === href ? 'text-indigo-600' : 'text-gray-500'
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
