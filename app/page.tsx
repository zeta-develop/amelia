import { Header } from "@/components/header"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-[#12F3D5]/10 to-gray-900">
      <Header />
      <Dashboard />
    </main>
  )
}
