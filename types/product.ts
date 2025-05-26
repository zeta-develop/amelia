export interface Product {
  id: string
  name: string
  buyPrice: number
  sellPrice: number
  stock: number
  barcode: string
  category: string
}

export interface CartItem extends Product {
  quantity: number
}

export interface Category {
  id: string
  name: string
}

export interface Sale {
  id: string
  items: CartItem[]
  total: number
  date: Date
  receiptNumber: string
}
