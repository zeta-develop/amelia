"use client"

import { useState, useEffect } from "react"
import { SearchBar } from "@/components/search-bar"
import { ProductList } from "@/components/product-list"
import { Cart } from "@/components/cart"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Product, CartItem } from "@/types/product"

export function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useLocalStorage<CartItem[]>("amelia-cart", [])
  const [products] = useLocalStorage<Product[]>("amelia-products", [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts([])
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.barcode.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)

      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item))
      } else {
        return [...prevCart, { ...product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setCart((prevCart) => prevCart.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-[#12F3D5]/30 bg-black/30 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4 text-[#12F3D5]">Punto de Venta</h2>
            <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} addToCart={addToCart} />
            {filteredProducts.length > 0 && <ProductList products={filteredProducts} addToCart={addToCart} />}
          </div>
        </div>
        <div>
          <Cart cart={cart} updateQuantity={updateCartItemQuantity} removeItem={removeFromCart} clearCart={clearCart} />
        </div>
      </div>
    </div>
  )
}
