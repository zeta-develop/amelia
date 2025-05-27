import { Header } from "@/components/header"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-[#12F3D5]/10 to-gray-900">
      <Header />
      <div className="flex-1 overflow-y-auto custom-scroll">
        <Dashboard />
      </div>
    </div>
  )
}
