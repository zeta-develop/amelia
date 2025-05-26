"use client"

import { useState } from "react"
import { History, Search, FileText, ChevronDown, ChevronUp, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { formatCurrency } from "@/lib/utils"
import type { Sale } from "@/types/product"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { BarcodeGenerator } from "@/components/barcode-generator"

export function SalesHistory() {
  const [salesHistory] = useLocalStorage<Sale[]>("amelia-sales-history", [])
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [expandedSale, setExpandedSale] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  // Filter sales by search term and date range
  const filteredSales = salesHistory.filter((sale) => {
    const matchesSearch =
      searchTerm === "" ||
      sale.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const saleDate = new Date(sale.date)
    const matchesStartDate = startDate === "" || new Date(startDate) <= saleDate
    const matchesEndDate = endDate === "" || new Date(endDate) >= saleDate

    return matchesSearch && matchesStartDate && matchesEndDate
  })

  // Sort sales by date (newest first)
  const sortedSales = [...filteredSales].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const toggleExpand = (saleId: string) => {
    if (expandedSale === saleId) {
      setExpandedSale(null)
    } else {
      setExpandedSale(saleId)
    }
  }

  const viewReceipt = (sale: Sale) => {
    setSelectedSale(sale)
    setIsReceiptOpen(true)
  }

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false)
  }

  const printReceipt = () => {
    window.print()
  }

  // Calculate total sales
  const totalSales = sortedSales.reduce((total, sale) => total + sale.total, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#12F3D5]/30 bg-black/30 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#12F3D5] flex items-center">
            <History className="h-5 w-5 mr-2 text-[#12F3D5]" />
            Historial de Ventas
          </h2>
          <div className="text-lg font-bold text-[#12F3D5]">Total: {formatCurrency(totalSales)}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#12F3D5]" />
            <Input
              type="text"
              placeholder="Buscar por recibo o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[#12F3D5]" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[#12F3D5]" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
            />
          </div>
        </div>

        {sortedSales.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-[#12F3D5]/50 mb-3" />
            <p className="text-gray-300">No hay ventas registradas</p>
            <p className="text-sm text-gray-400 mt-1">Las ventas completadas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSales.map((sale) => (
              <div key={sale.id} className="rounded-lg border border-[#12F3D5]/20 bg-black/20 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#12F3D5]/5"
                  onClick={() => toggleExpand(sale.id)}
                >
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-[#12F3D5]">Recibo #{sale.receiptNumber}</span>
                      <span className="ml-4 text-sm text-gray-400">
                        {new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {sale.items.length} productos • Total: {formatCurrency(sale.total)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#12F3D5] hover:text-[#12F3D5]/80 hover:bg-[#12F3D5]/10 mr-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewReceipt(sale)
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Recibo
                    </Button>
                    {expandedSale === sale.id ? (
                      <ChevronUp className="h-5 w-5 text-[#12F3D5]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#12F3D5]" />
                    )}
                  </div>
                </div>

                {expandedSale === sale.id && (
                  <div className="p-4 border-t border-[#12F3D5]/20 bg-[#12F3D5]/5">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-[#12F3D5] uppercase">
                          <th className="text-left py-2">Producto</th>
                          <th className="text-center py-2">Cantidad</th>
                          <th className="text-right py-2">Precio</th>
                          <th className="text-right py-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12F3D5]/10">
                        {sale.items.map((item) => (
                          <tr key={item.id} className="text-sm">
                            <td className="py-2 text-white">{item.name}</td>
                            <td className="py-2 text-center text-gray-300">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-300">{formatCurrency(item.sellPrice)}</td>
                            <td className="py-2 text-right text-white">
                              {formatCurrency(item.sellPrice * item.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="py-2 text-right font-medium text-white">
                            Total
                          </td>
                          <td className="py-2 text-right font-bold text-[#12F3D5]">{formatCurrency(sale.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt Dialog */}
      {isReceiptOpen && selectedSale && (
        <Dialog
          open={isReceiptOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseReceipt()
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5]">Recibo de Venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 print:text-black" id="receipt-to-print">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-[#12F3D5] print:text-black">Librería Amelia</h2>
                <p className="text-sm text-gray-300 print:text-gray-600">
                  {new Date(selectedSale.date).toLocaleDateString()} {new Date(selectedSale.date).toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-300 print:text-gray-600">Recibo #{selectedSale.receiptNumber}</p>
              </div>

              <div className="space-y-3">
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white print:text-black">
                        {item.name} <span className="text-[#12F3D5] print:text-gray-600">x{item.quantity}</span>
                      </span>
                      <span className="text-white print:text-black">
                        {formatCurrency(item.sellPrice * item.quantity)}
                      </span>
                    </div>
                    <div className="flex justify-center py-1">
                      <BarcodeGenerator
                        value={item.barcode}
                        height={40}
                        width={1.5}
                        displayValue={true}
                        className="w-full max-w-[200px]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#12F3D5]/20 print:border-gray-300">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-white print:text-black">Total</span>
                  <span className="text-[#12F3D5] print:text-black">{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-300 print:text-gray-600">¡Gracias por su compra!</div>
            </div>
            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={handleCloseReceipt}>
                Cerrar
              </Button>
              <Button onClick={printReceipt} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                <Download className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
