"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/product"

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  addToCart: (product: Product, quantity?: number) => void
}

export function SearchBar({ searchTerm, setSearchTerm, addToCart }: SearchBarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim() !== "") {
      e.preventDefault()
      // Simulate a small loading delay for better UX
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  const handleClear = () => {
    setSearchTerm("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#12F3D5]" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
            >
              ×
            </button>
          )}
        </div>
        <Button disabled={isLoading} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>
    </div>
  )
}
