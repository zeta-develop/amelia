"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Save, X, BarChart4, Barcode, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Product, Category } from "@/types/product"
import { formatCurrency } from "@/lib/utils"
import { BarcodeGenerator } from "@/components/barcode-generator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CSVHandler } from "@/components/csv-handler"
import { InventorySummary } from "@/components/inventory-summary"
import { InventoryTable } from "@/components/inventory-table"

export function InventoryManager() {
  const [products, setProducts] = useLocalStorage<Product[]>("amelia-products", [])
  const [categories, setCategories] = useLocalStorage<Category[]>("amelia-categories", [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({})
  const [newCategory, setNewCategory] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBarcode, setSelectedBarcode] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Filter products by search term and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Calculate totals
  const totalBuyValue = products.reduce((total, product) => total + product.buyPrice * product.stock, 0)
  const totalSellValue = products.reduce((total, product) => total + product.sellPrice * product.stock, 0)
  const potentialProfit = totalSellValue - totalBuyValue

  const handleAddNew = () => {
    setCurrentProduct({
      id: crypto.randomUUID(),
      name: "",
      buyPrice: 0,
      sellPrice: 0,
      stock: 0,
      barcode: generateRandomBarcode(),
      category: categories.length > 0 ? categories[0].id : "",
    })
    setIsEditing(false)
    setIsDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setCurrentProduct(product)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      setProducts(products.filter((product) => product.id !== id))
    }
  }

  const handleSave = () => {
    if (!currentProduct.name || !currentProduct.barcode) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    if (currentProduct.buyPrice! > currentProduct.sellPrice!) {
      if (!confirm("El precio de compra es mayor que el precio de venta. ¿Deseas continuar?")) {
        return
      }
    }

    if (isEditing) {
      setProducts(products.map((product) => (product.id === currentProduct.id ? (currentProduct as Product) : product)))
    } else {
      setProducts([...products, currentProduct as Product])
    }

    setIsDialogOpen(false)
  }

  const generateRandomBarcode = () => {
    // Generate a random 13-digit EAN barcode
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("")
  }

  const showBarcode = (barcode: string) => {
    setSelectedBarcode(barcode)
    setIsBarcodeDialogOpen(true)
  }

  const addCategory = () => {
    if (!newCategory.trim()) {
      alert("Por favor ingresa un nombre para la categoría")
      return
    }

    // Check if category already exists
    if (categories.some((cat) => cat.name.toLowerCase() === newCategory.toLowerCase())) {
      alert("Esta categoría ya existe")
      return
    }

    const newCategoryObj = {
      id: crypto.randomUUID(),
      name: newCategory.trim(),
    }

    setCategories([...categories, newCategoryObj])
    setNewCategory("")
    setIsCategoryDialogOpen(false)
  }

  const deleteCategory = (id: string) => {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar esta categoría? Los productos asociados a esta categoría quedarán sin categoría.",
      )
    ) {
      // Update products that use this category
      const updatedProducts = products.map((product) => {
        if (product.category === id) {
          return { ...product, category: "" }
        }
        return product
      })

      setProducts(updatedProducts)
      setCategories(categories.filter((cat) => cat.id !== id))

      // If the active category is deleted, switch to "all"
      if (activeCategory === id) {
        setActiveCategory("all")
      }
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  // Manejadores seguros para los diálogos
  const handleOpenProductDialog = () => setIsDialogOpen(true)
  const handleCloseProductDialog = () => setIsDialogOpen(false)

  const handleOpenBarcodeDialog = () => setIsBarcodeDialogOpen(true)
  const handleCloseBarcodeDialog = () => setIsBarcodeDialogOpen(false)

  const handleOpenCategoryDialog = () => setIsCategoryDialogOpen(true)
  const handleCloseCategoryDialog = () => setIsCategoryDialogOpen(false)

  // Función para manejar la importación de productos desde CSV
  const handleImportProducts = (importedProducts: Product[]) => {
    // Crear un mapa de productos existentes por ID para búsqueda rápida
    const existingProductsMap = new Map(products.map((product) => [product.id, product]))

    // Procesar productos importados
    const updatedProducts = [...products]

    importedProducts.forEach((importedProduct) => {
      const existingIndex = updatedProducts.findIndex((p) => p.id === importedProduct.id)

      if (existingIndex >= 0) {
        // Actualizar producto existente
        updatedProducts[existingIndex] = importedProduct
      } else {
        // Agregar nuevo producto
        updatedProducts.push(importedProduct)
      }
    })

    // Actualizar el estado
    setProducts(updatedProducts)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#12F3D5]/30 bg-black/30 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#12F3D5] flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-[#12F3D5]" />
            Gestión de Inventario
          </h2>
          <div className="flex gap-2">
            <CSVHandler products={products} categories={categories} onImport={handleImportProducts} />
            <Button onClick={handleOpenCategoryDialog} className="bg-[#12F3D5]/20 hover:bg-[#12F3D5]/30 text-[#12F3D5]">
              <FolderPlus className="h-4 w-4 mr-1" />
              Categorías
            </Button>
            <Button onClick={handleAddNew} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        <InventorySummary
          totalBuyValue={totalBuyValue}
          totalSellValue={totalSellValue}
          potentialProfit={potentialProfit}
        />

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
          />
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
          <TabsList className="bg-gray-900/60 border border-[#12F3D5]/20 p-1">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-[#12F3D5]/20 data-[state=active]:text-[#12F3D5] text-gray-300"
            >
              Todos
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="data-[state=active]:bg-[#12F3D5]/20 data-[state=active]:text-[#12F3D5] text-gray-300"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <InventoryTable
          products={products}
          categories={categories}
          filteredProducts={filteredProducts}
          getCategoryName={getCategoryName}
          showBarcode={showBarcode}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          searchTerm={searchTerm}
          activeCategory={activeCategory}
        />
      </div>

      {/* Product Dialog */}
      {isDialogOpen && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseProductDialog()
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5]">{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto pr-1">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-[#12F3D5]">
                  Nombre del Producto*
                </label>
                <Input
                  id="name"
                  value={currentProduct.name || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="category" className="text-sm font-medium text-[#12F3D5]">
                  Categoría
                </label>
                <Select
                  value={currentProduct.category || ""}
                  onValueChange={(value) => setCurrentProduct({ ...currentProduct, category: value })}
                >
                  <SelectTrigger className="bg-gray-900/60 border-[#12F3D5]/30 focus:ring-[#12F3D5] text-white">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-[#12F3D5]/30">
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="barcode" className="text-sm font-medium text-[#12F3D5]">
                  Código de Barras*
                </label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={currentProduct.barcode || ""}
                    onChange={(e) => setCurrentProduct({ ...currentProduct, barcode: e.target.value })}
                    className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentProduct({ ...currentProduct, barcode: generateRandomBarcode() })}
                    className="border-[#12F3D5]/30 text-[#12F3D5]"
                  >
                    Generar
                  </Button>
                </div>
                {currentProduct.barcode && (
                  <div className="mt-2 flex justify-center">
                    <BarcodeGenerator value={currentProduct.barcode} className="w-full" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="buyPrice" className="text-sm font-medium text-[#12F3D5]">
                    Precio de Compra
                  </label>
                  <Input
                    id="buyPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentProduct.buyPrice || ""}
                    onChange={(e) =>
                      setCurrentProduct({ ...currentProduct, buyPrice: Number.parseFloat(e.target.value) })
                    }
                    className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="sellPrice" className="text-sm font-medium text-[#12F3D5]">
                    Precio de Venta
                  </label>
                  <Input
                    id="sellPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentProduct.sellPrice || ""}
                    onChange={(e) =>
                      setCurrentProduct({ ...currentProduct, sellPrice: Number.parseFloat(e.target.value) })
                    }
                    className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="stock" className="text-sm font-medium text-[#12F3D5]">
                  Stock
                </label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={currentProduct.stock || ""}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, stock: Number.parseInt(e.target.value) })}
                  className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                />
              </div>
              {currentProduct.buyPrice && currentProduct.sellPrice && currentProduct.stock ? (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#12F3D5]/20">
                  <div>
                    <span className="text-sm text-[#12F3D5]/70">Total Compra:</span>
                    <p className="font-medium text-[#12F3D5]">
                      {formatCurrency(currentProduct.buyPrice * currentProduct.stock)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[#12F3D5]/70">Total Venta:</span>
                    <p className="font-medium text-[#12F3D5]">
                      {formatCurrency(currentProduct.sellPrice * currentProduct.stock)}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseProductDialog}>
                <X className="h-4 w-4 mr-1" />
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Barcode Dialog */}
      {isBarcodeDialogOpen && (
        <Dialog
          open={isBarcodeDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseBarcodeDialog()
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-w-sm max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5]">Código de Barras</DialogTitle>
            </DialogHeader>
            <div className="py-4 flex flex-col items-center">
              <BarcodeGenerator value={selectedBarcode} height={150} width={2} className="w-full" />
              <p className="mt-4 text-center text-gray-300 text-sm">
                Puedes escanear este código con cualquier lector de códigos de barras
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCloseBarcodeDialog}
                className="w-full bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Dialog */}
      {isCategoryDialogOpen && (
        <Dialog
          open={isCategoryDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseCategoryDialog()
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5]">Gestionar Categorías</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Nueva categoría..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
                />
                <Button onClick={addCategory} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">No hay categorías creadas</p>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#12F3D5]/5 border border-[#12F3D5]/20"
                    >
                      <span className="text-white">{category.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCloseCategoryDialog} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
