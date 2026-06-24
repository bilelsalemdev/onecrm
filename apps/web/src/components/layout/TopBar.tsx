import { useLocation, Link } from 'react-router'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

const today = new Date().toISOString().slice(0, 10)

export function TopBar() {
  const location = useLocation()

  const parts = location.pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'desk', to: '/' }]
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    crumbs.push({ label: part.toLowerCase(), to: path })
  }

  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-background/85 backdrop-blur-md px-4 md:px-7 sticky top-0 z-10">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Location readout — terminal path */}
      <nav className="readout flex items-center gap-1.5 text-[13px] min-w-0">
        {crumbs.map((crumb, i, arr) => (
          <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-muted-foreground/35 select-none">/</span>}
            {i === arr.length - 1 ? (
              <span className="text-foreground truncate">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-muted-foreground hover:text-foreground transition-colors duration-150 truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Live status */}
      <div className="ml-auto hidden sm:flex items-center gap-3 readout text-[11px] text-muted-foreground">
        <span className="tabular-nums">{today}</span>
        <span className="h-3.5 w-px bg-border" />
        <span className="flex items-center gap-1.5 text-foreground/70">
          <span className="text-lamp-green"><span className="lamp lamp-sm animate-lamp" /></span>
          LIVE
        </span>
      </div>
    </header>
  )
}
