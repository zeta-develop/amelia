"use client"

import { useState } from "react"
import { Trash2, ShoppingCart, Minus, Plus, CreditCard, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CartItem, Sale } from "@/types/product"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { BarcodeGenerator } from "@/components/barcode-generator"

interface CartProps {
  cart: CartItem[]
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

export function Cart({ cart, updateQuantity, removeItem, clearCart }: CartProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<{
    items: CartItem[]
    total: number
    date: Date
    receiptNumber: string
  } | null>(null)
  const [products, setProducts] = useLocalStorage<any[]>("amelia-products", [])
  const [categories] = useLocalStorage<any[]>("amelia-categories", [])
  const [salesHistory, setSalesHistory] = useLocalStorage<Sale[]>("amelia-sales-history", [])

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)
  const subtotal = cart.reduce((total, item) => total + item.sellPrice * item.quantity, 0)

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true)
  }

  const handleCloseCheckout = () => {
    setIsCheckoutOpen(false)
  }

  const handleOpenReceipt = () => {
    setIsReceiptOpen(true)
  }

  const handleCloseReceipt = () => {
    setIsReceiptOpen(false)
  }

  const completeCheckout = () => {
    // Update stock for each product in the cart
    const updatedProducts = products.map((product) => {
      const cartItem = cart.find((item) => item.id === product.id)
      if (cartItem) {
        return {
          ...product,
          stock: product.stock - cartItem.quantity,
        }
      }
      return product
    })

    // Save updated products to localStorage
    setProducts(updatedProducts)

    // Generate receipt data
    const receiptNumber = `R-${Date.now().toString().slice(-6)}`
    const saleData = {
      id: crypto.randomUUID(),
      items: [...cart],
      total: subtotal,
      date: new Date(),
      receiptNumber,
    }

    setReceiptData(saleData)

    // Add to sales history
    setSalesHistory([...salesHistory, saleData])

    // Close checkout dialog and open receipt
    handleCloseCheckout()
    handleOpenReceipt()

    // Clear the cart
    clearCart()
  }

  const printReceipt = () => {
    window.print()
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  return (
    <div className="rounded-xl border border-[#12F3D5]/30 bg-black/30 backdrop-blur-sm h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#12F3D5] flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-[#12F3D5]" />
            Carrito
          </h2>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Vaciar
            </Button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-[#12F3D5]/50 mb-3" />
            <p className="text-gray-300">Tu carrito está vacío</p>
            <p className="text-sm text-gray-400 mt-1">Busca productos para agregarlos</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#12F3D5]/5 border border-[#12F3D5]/20"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{item.name}</h3>
                    <p className="text-xs text-gray-300 mt-1">
                      {formatCurrency(item.sellPrice)} c/u · {getCategoryName(item.category)}
                    </p>
                  </div>
                  <div className="flex items-center ml-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-[#12F3D5]/50"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                      <span className="sr-only">Decrease</span>
                    </Button>
                    <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 rounded-full border-[#12F3D5]/50"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                    >
                      <Plus className="h-3 w-3" />
                      <span className="sr-only">Increase</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-[#12F3D5]/20">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Subtotal</span>
                <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Productos</span>
                <span className="font-medium text-white">{totalItems}</span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-[#12F3D5]/20 mt-2">
                <span className="font-medium text-white">Total</span>
                <span className="font-bold text-[#12F3D5]">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-6 bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900"
              onClick={handleOpenCheckout}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Completar venta
            </Button>
          </>
        )}
      </div>

      {/* Checkout Dialog */}
      {isCheckoutOpen && (
        <Dialog
          open={isCheckoutOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseCheckout()
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5]">Completar venta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.name} <span className="text-[#12F3D5]">x{item.quantity}</span>
                    </span>
                    <span className="text-white">{formatCurrency(item.sellPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-[#12F3D5]/20">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-[#12F3D5]">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCheckout}>
                Cancelar
              </Button>
              <Button onClick={completeCheckout} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                Confirmar venta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Dialog */}
      {isReceiptOpen && receiptData && (
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
                  {receiptData.date.toLocaleDateString()} {receiptData.date.toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-300 print:text-gray-600">Recibo #{receiptData.receiptNumber}</p>
              </div>

              <div className="space-y-3">
                {receiptData.items.map((item) => (
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
                  <span className="text-[#12F3D5] print:text-black">{formatCurrency(receiptData.total)}</span>
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-300 print:text-gray-600">¡Gracias por su compra!</div>
            </div>
            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={handleCloseReceipt}>
                Cerrar
              </Button>
              <Button onClick={printReceipt} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
