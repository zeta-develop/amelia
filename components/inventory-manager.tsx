"use client"

import { useState, useMemo, useCallback } from "react"
import { Plus, Edit, Trash2, Save, X, BarChart4, Barcode, FolderPlus, Filter, SortAsc, SortDesc } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Product, Category } from "@/types/product"
import { formatCurrency } from "@/lib/utils"
import { BarcodeGenerator } from "@/components/barcode-generator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CSVHandler } from "@/components/csv-handler"
import { InventorySummary } from "@/components/inventory-summary"
import { useDebounce } from "@/hooks/use-debounce"

const ITEMS_PER_PAGE = 20

type SortField = "name" | "buyPrice" | "sellPrice" | "stock" | "category"
type SortDirection = "asc" | "desc"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")

  // Debounce search term for better performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Memoized filtered and sorted products
  const { filteredProducts, totalPages } = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesCategory = activeCategory === "all" || product.category === activeCategory

      let matchesStock = true
      if (stockFilter === "low") {
        matchesStock = product.stock > 0 && product.stock <= 10
      } else if (stockFilter === "out") {
        matchesStock = product.stock === 0
      }

      return matchesSearch && matchesCategory && matchesStock
    })

    // Sort products
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "category") {
        aValue = getCategoryName(a.category)
        bValue = getCategoryName(b.category)
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const paginatedProducts = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    return { filteredProducts: paginatedProducts, totalPages, totalItems: filtered.length }
  }, [products, debouncedSearchTerm, activeCategory, stockFilter, sortField, sortDirection, currentPage])

  // Reset page when filters change
  const handleFilterChange = useCallback((newFilter: any, filterType: string) => {
    setCurrentPage(1)
    if (filterType === "search") setSearchTerm(newFilter)
    else if (filterType === "category") setActiveCategory(newFilter)
    else if (filterType === "stock") setStockFilter(newFilter)
  }, [])

  // Handle sorting
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
      setCurrentPage(1)
    },
    [sortField, sortDirection],
  )

  // Calculate totals with memoization
  const { totalBuyValue, totalSellValue, potentialProfit } = useMemo(() => {
    const totalBuy = products.reduce((total, product) => total + product.buyPrice * product.stock, 0)
    const totalSell = products.reduce((total, product) => total + product.sellPrice * product.stock, 0)
    return {
      totalBuyValue: totalBuy,
      totalSellValue: totalSell,
      potentialProfit: totalSell - totalBuy,
    }
  }, [products])

  const handleAddNew = useCallback(() => {
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
  }, [categories])

  const handleEdit = useCallback((product: Product) => {
    setCurrentProduct(product)
    setIsEditing(true)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
        setProducts(products.filter((product) => product.id !== id))
      }
    },
    [products, setProducts],
  )

  const handleSave = useCallback(() => {
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
  }, [currentProduct, isEditing, products, setProducts])

  const generateRandomBarcode = () => {
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("")
  }

  const showBarcode = useCallback((barcode: string) => {
    setSelectedBarcode(barcode)
    setIsBarcodeDialogOpen(true)
  }, [])

  const addCategory = useCallback(() => {
    if (!newCategory.trim()) {
      alert("Por favor ingresa un nombre para la categoría")
      return
    }

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
  }, [newCategory, categories, setCategories])

  const deleteCategory = useCallback(
    (id: string) => {
      if (
        confirm(
          "¿Estás seguro de que deseas eliminar esta categoría? Los productos asociados a esta categoría quedarán sin categoría.",
        )
      ) {
        const updatedProducts = products.map((product) => {
          if (product.category === id) {
            return { ...product, category: "" }
          }
          return product
        })

        setProducts(updatedProducts)
        setCategories(categories.filter((cat) => cat.id !== id))

        if (activeCategory === id) {
          setActiveCategory("all")
        }
      }
    },
    [products, categories, activeCategory, setProducts, setCategories],
  )

  const getCategoryName = useCallback(
    (categoryId: string) => {
      const category = categories.find((cat) => cat.id === categoryId)
      return category ? category.name : "Sin categoría"
    },
    [categories],
  )

  const handleImportProducts = useCallback(
    (importedProducts: Product[]) => {
      const existingProductsMap = new Map(products.map((product) => [product.id, product]))
      const updatedProducts = [...products]

      importedProducts.forEach((importedProduct) => {
        const existingIndex = updatedProducts.findIndex((p) => p.id === importedProduct.id)

        if (existingIndex >= 0) {
          updatedProducts[existingIndex] = importedProduct
        } else {
          updatedProducts.push(importedProduct)
        }
      })

      setProducts(updatedProducts)
    },
    [products, setProducts],
  )

  // Pagination component
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-400">
        Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, products.length)}{" "}
        de {products.length} productos
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="border-[#12F3D5]/30 text-[#12F3D5]"
        >
          Anterior
        </Button>
        <span className="flex items-center px-3 text-sm text-gray-300">
          Página {currentPage} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="border-[#12F3D5]/30 text-[#12F3D5]"
        >
          Siguiente
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#12F3D5]/30 bg-black/30 p-6 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-[#12F3D5] flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-[#12F3D5]" />
            Gestión de Inventario
          </h2>
          <div className="flex flex-wrap gap-2">
            <CSVHandler products={products} categories={categories} onImport={handleImportProducts} />
            <Button
              onClick={() => setIsCategoryDialogOpen(true)}
              className="bg-[#12F3D5]/20 hover:bg-[#12F3D5]/30 text-[#12F3D5]"
            >
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

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => handleFilterChange(e.target.value, "search")}
              className="bg-gray-900/60 border-[#12F3D5]/30 focus-visible:ring-[#12F3D5] text-white"
            />
          </div>

          <Select value={activeCategory} onValueChange={(value) => handleFilterChange(value, "category")}>
            <SelectTrigger className="bg-gray-900/60 border-[#12F3D5]/30 focus:ring-[#12F3D5] text-white">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#12F3D5]/30">
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={stockFilter}
            onValueChange={(value: "all" | "low" | "out") => handleFilterChange(value, "stock")}
          >
            <SelectTrigger className="bg-gray-900/60 border-[#12F3D5]/30 focus:ring-[#12F3D5] text-white">
              <SelectValue placeholder="Filtrar por stock" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#12F3D5]/30">
              <SelectItem value="all">Todo el stock</SelectItem>
              <SelectItem value="low">Stock bajo (≤10)</SelectItem>
              <SelectItem value="out">Sin stock</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#12F3D5]" />
            <span className="text-sm text-gray-300">{filteredProducts.length} productos</span>
          </div>
        </div>

        {/* Optimized Table */}
        <div className="rounded-lg border border-[#12F3D5]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-[#12F3D5]/10">
                <tr>
                  {[
                    { key: "name", label: "Nombre" },
                    { key: "category", label: "Categoría" },
                    { key: null, label: "Código" },
                    { key: "buyPrice", label: "Precio Compra" },
                    { key: "sellPrice", label: "Precio Venta" },
                    { key: "stock", label: "Stock" },
                    { key: null, label: "Total Compra" },
                    { key: null, label: "Total Venta" },
                    { key: null, label: "Acciones" },
                  ].map((column, index) => (
                    <th
                      key={index}
                      className={`px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider ${
                        column.key ? "cursor-pointer hover:bg-[#12F3D5]/20" : ""
                      }`}
                      onClick={column.key ? () => handleSort(column.key as SortField) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {column.label}
                        {column.key &&
                          sortField === column.key &&
                          (sortDirection === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12F3D5]/20 bg-black/20">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <BarChart4 className="h-12 w-12 text-[#12F3D5]/50 mb-3" />
                        <p className="text-gray-300 mb-2">
                          {debouncedSearchTerm || activeCategory !== "all" || stockFilter !== "all"
                            ? "No se encontraron productos con los filtros aplicados"
                            : "No hay productos en el inventario"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {debouncedSearchTerm || activeCategory !== "all" || stockFilter !== "all"
                            ? "Intenta cambiar los filtros de búsqueda"
                            : "Comienza agregando tu primer producto"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#12F3D5]/5 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {getCategoryName(product.category)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center">
                          <span className="truncate max-w-[100px]">{product.barcode}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showBarcode(product.barcode)}
                            className="ml-2 text-[#12F3D5] hover:text-[#12F3D5]/80 hover:bg-[#12F3D5]/10 h-6 w-6 p-0"
                          >
                            <Barcode className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">
                        {formatCurrency(product.buyPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">
                        {formatCurrency(product.sellPrice)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        <span
                          className={`${
                            product.stock === 0
                              ? "text-red-400"
                              : product.stock <= 10
                                ? "text-yellow-400"
                                : "text-white"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">
                        {formatCurrency(product.buyPrice * product.stock)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">
                        {formatCurrency(product.sellPrice * product.stock)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(product)}
                            className="text-[#12F3D5] hover:text-[#12F3D5]/80 hover:bg-[#12F3D5]/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <PaginationControls />}
      </div>

      {/* Dialogs remain the same but with optimized handlers */}
      {/* Product Dialog */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
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
        <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
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
                onClick={() => setIsBarcodeDialogOpen(false)}
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
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
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
              <Button
                onClick={() => setIsCategoryDialogOpen(false)}
                className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900"
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
