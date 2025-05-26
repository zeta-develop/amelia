import { Header } from "@/components/header"
import { SalesHistory } from "@/components/sales-history"

export default function HistorialPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-[#12F3D5]/10 to-gray-900">
      <Header />
      <div className="container mx-auto px-2 py-4">
        <SalesHistory />
      </div>
    </main>
  )
}
