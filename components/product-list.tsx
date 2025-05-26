"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Product } from "@/types/product"
import { formatCurrency } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"

interface ProductListProps {
  products: Product[]
  addToCart: (product: Product, quantity?: number) => void
}

export function ProductList({ products, addToCart }: ProductListProps) {
  const [categories] = useLocalStorage<any[]>("amelia-categories", [])

  if (products.length === 0) {
    return null
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  return (
    <div className="mt-4">
      <div className="rounded-lg border border-[#12F3D5]/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#12F3D5]/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12F3D5]/20 bg-black/20">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#12F3D5]/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                    {getCategoryName(product.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{product.barcode}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">
                    {formatCurrency(product.sellPrice)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">{product.stock}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      size="sm"
                      onClick={() => addToCart(product)}
                      className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900"
                      disabled={product.stock <= 0}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
