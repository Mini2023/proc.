import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { OnboardingModal } from '@/components/proc/OnboardingModal'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="app-sidebar">
        <Sidebar />
      </div>
      <main
        className="app-main"
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f0f2f5 0%, #e8ecf4 50%, #f0f2f5 100%)',
          backgroundAttachment: 'fixed',
          flex: 1,
        }}
      >
        <div
          className="app-content"
          style={{
            maxWidth: '720px',
            margin: '0 auto',
            padding: '56px 24px',
          }}
        >
          {children}
        </div>
      </main>
      <BottomNav />
      <OnboardingModal />
    </div>
  )
}
