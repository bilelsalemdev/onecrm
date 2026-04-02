import { useLocation, Link } from 'react-router'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function TopBar() {
  const location = useLocation()

  const breadcrumbs = () => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 0) return [{ label: 'Dashboard', to: '/' }]

    const crumbs = [{ label: 'Home', to: '/' }]
    let path = ''
    for (const part of parts) {
      path += `/${part}`
      crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1), to: path })
    }
    return crumbs
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs().map((crumb, i, arr) => (
          <span key={crumb.to} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {i === arr.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
    </header>
  )
}
