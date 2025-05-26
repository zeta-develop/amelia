import { BookOpenText } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b border-[#12F3D5]/20 backdrop-blur-md bg-black/40">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <BookOpenText className="h-6 w-6 text-[#12F3D5]" />
          <span className="text-xl font-bold bg-gradient-to-r from-[#12F3D5] to-[#12F3D5]/70 bg-clip-text text-transparent">
            Librería Amelia
          </span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium text-[#12F3D5]/80 hover:text-[#12F3D5] transition-colors">
            Ventas
          </Link>
          <Link
            href="/inventario"
            className="text-sm font-medium text-[#12F3D5]/80 hover:text-[#12F3D5] transition-colors"
          >
            Inventario
          </Link>
          <Link
            href="/historial"
            className="text-sm font-medium text-[#12F3D5]/80 hover:text-[#12F3D5] transition-colors"
          >
            Historial
          </Link>
        </nav>
      </div>
    </header>
  )
}
