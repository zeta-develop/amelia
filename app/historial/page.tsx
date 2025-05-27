import { Header } from "@/components/header"
import { SalesHistory } from "@/components/sales-history"

export default function HistorialPage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-[#12F3D5]/10 to-gray-900">
      <Header />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <div className="container mx-auto px-2 py-4">
          <SalesHistory />
        </div>
      </div>
    </div>
  )
}
