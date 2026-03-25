// ============================================================
//  app/(main)/layout.tsx
//  Layout compartido: Header + NavMobile + estructura de página
// ============================================================

import Header from '@/components/layout/Header'
import NavBarMobile from '@/components/layout/NavBarMobile'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Header />
      <main style={{ flex: 1 }}>
        {children}
      </main>
      <NavBarMobile />
    </div>
  )
}
