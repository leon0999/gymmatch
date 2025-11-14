'use client';

/**
 * GymMatch - Bottom Navigation Bar
 *
 * Persistent navigation across main pages
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageSquare, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/feed',
      label: 'Feed',
      icon: Home,
    },
    {
      href: '/discover',
      label: 'Discover',
      icon: Search,
    },
    {
      href: '/matches',
      label: 'Matches',
      icon: MessageSquare,
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive
                    ? 'text-emerald-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className={`relative ${isActive ? 'scale-110 transition-transform' : ''}`}>
                  <IconComponent className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px]">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </nav>
  );
}
