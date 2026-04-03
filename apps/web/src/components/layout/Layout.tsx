import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
