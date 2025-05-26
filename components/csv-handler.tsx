"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileSpreadsheet, Upload, Download, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import type { Product, Category } from "@/types/product"

interface CSVHandlerProps {
  products: Product[]
  categories: Category[]
  onImport: (products: Product[]) => void
}

export function CSVHandler({ products, categories, onImport }: CSVHandlerProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para exportar productos a CSV
  const exportToCSV = () => {
    // Definir las cabeceras del CSV
    const headers = ["id", "name", "buyPrice", "sellPrice", "stock", "barcode", "category"]

    // Convertir productos a filas CSV
    const rows = products.map((product) => {
      return [
        product.id,
        `"${product.name.replace(/"/g, '""')}"`, // Escapar comillas dobles
        product.buyPrice,
        product.sellPrice,
        product.stock,
        product.barcode,
        product.category,
      ]
    })

    // Combinar cabeceras y filas
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

    // Crear un blob y un enlace de descarga
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `inventario-libreria-amelia-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsExportDialogOpen(false)
  }

  // Función para importar productos desde CSV
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportProgress(0)
    setImportStatus(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string
        const lines = csvText.split("\n")
        const headers = lines[0].split(",")

        // Validar cabeceras
        const requiredHeaders = ["name", "buyPrice", "sellPrice", "stock", "barcode"]
        const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header))

        if (missingHeaders.length > 0) {
          setImportStatus({
            success: false,
            message: "El archivo CSV no tiene el formato correcto",
            details: `Faltan las siguientes columnas: ${missingHeaders.join(", ")}`,
          })
          return
        }

        // Procesar filas
        const importedProducts: Product[] = []
        const errors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue // Saltar líneas vacías

          const values = parseCSVLine(lines[i])
          if (values.length !== headers.length) {
            errors.push(`Línea ${i + 1}: Número incorrecto de columnas`)
            continue
          }

          // Crear objeto de producto
          const product: any = {}
          headers.forEach((header, index) => {
            product[header.trim()] = values[index]
          })

          // Validar y convertir tipos
          try {
            const validatedProduct: Product = {
              id: product.id || crypto.randomUUID(),
              name: product.name || "",
              buyPrice: Number.parseFloat(product.buyPrice) || 0,
              sellPrice: Number.parseFloat(product.sellPrice) || 0,
              stock: Number.parseInt(product.stock) || 0,
              barcode: product.barcode || generateRandomBarcode(),
              category: product.category || "",
            }

            if (!validatedProduct.name) {
              errors.push(`Línea ${i + 1}: Nombre del producto es requerido`)
              continue
            }

            importedProducts.push(validatedProduct)
          } catch (error) {
            errors.push(`Línea ${i + 1}: Error al procesar datos - ${error}`)
          }

          // Actualizar progreso
          setImportProgress(Math.floor((i / (lines.length - 1)) * 100))
        }

        // Finalizar importación
        if (importedProducts.length > 0) {
          onImport(importedProducts)
          setImportStatus({
            success: true,
            message: `Se importaron ${importedProducts.length} productos correctamente`,
            details: errors.length > 0 ? `Hubo ${errors.length} errores: ${errors.join("; ")}` : undefined,
          })
        } else {
          setImportStatus({
            success: false,
            message: "No se pudo importar ningún producto",
            details: errors.join("\n"),
          })
        }
      } catch (error) {
        setImportStatus({
          success: false,
          message: "Error al procesar el archivo CSV",
          details: String(error),
        })
      }

      // Limpiar input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }

    reader.readAsText(file)
  }

  // Función para generar un código de barras aleatorio
  const generateRandomBarcode = () => {
    return Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join("")
  }

  // Función para parsear líneas CSV (maneja comillas correctamente)
  const parseCSVLine = (line: string): string[] => {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        // Si encontramos una comilla doble
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Comilla escapada dentro de comillas
          current += '"'
          i++ // Saltar la siguiente comilla
        } else {
          // Alternar estado de comillas
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        // Si encontramos una coma fuera de comillas, termina el campo actual
        result.push(current)
        current = ""
      } else {
        // Cualquier otro carácter se agrega al campo actual
        current += char
      }
    }

    // Agregar el último campo
    result.push(current)
    return result
  }

  // Función para descargar plantilla CSV
  const downloadTemplate = () => {
    const headers = ["name", "buyPrice", "sellPrice", "stock", "barcode", "category"]
    const exampleRow = ["Producto Ejemplo", "100", "150", "10", "1234567890123", ""]

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "plantilla-inventario.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setIsExportDialogOpen(true)}
          className="bg-[#12F3D5]/20 hover:bg-[#12F3D5]/30 text-[#12F3D5]"
        >
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
        <Button
          onClick={() => setIsImportDialogOpen(true)}
          className="bg-[#12F3D5]/20 hover:bg-[#12F3D5]/30 text-[#12F3D5]"
        >
          <Upload className="h-4 w-4 mr-1" />
          Importar CSV
        </Button>
      </div>

      {/* Diálogo de Exportación */}
      {isExportDialogOpen && (
        <Dialog
          open={isExportDialogOpen}
          onOpenChange={(open) => {
            if (!open) setIsExportDialogOpen(false)
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5] flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Exportar Inventario a CSV
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300 mb-4">
                Se exportarán {products.length} productos a un archivo CSV que podrás abrir con Excel u otra aplicación
                de hojas de cálculo.
              </p>
              <div className="rounded-lg bg-[#12F3D5]/10 p-4 border border-[#12F3D5]/20">
                <h3 className="text-sm font-medium text-[#12F3D5]/70 mb-1">El archivo incluirá:</h3>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                  <li>Nombre del producto</li>
                  <li>Precio de compra y venta</li>
                  <li>Stock actual</li>
                  <li>Código de barras</li>
                  <li>Categoría</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={exportToCSV} className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Importación */}
      {isImportDialogOpen && (
        <Dialog
          open={isImportDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsImportDialogOpen(false)
              setImportStatus(null)
              setImportProgress(0)
            }
          }}
        >
          <DialogContent className="bg-gray-900 border-[#12F3D5]/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#12F3D5] flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Importar Inventario desde CSV
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {!importStatus ? (
                <>
                  <p className="text-gray-300 mb-4">
                    Selecciona un archivo CSV para importar productos al inventario. El archivo debe tener las
                    siguientes columnas: name, buyPrice, sellPrice, stock, barcode.
                  </p>
                  <div className="rounded-lg bg-[#12F3D5]/10 p-4 border border-[#12F3D5]/20 mb-4">
                    <h3 className="text-sm font-medium text-[#12F3D5]/70 mb-1">Notas importantes:</h3>
                    <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                      <li>La primera fila debe contener los nombres de las columnas</li>
                      <li>Si un producto ya existe (mismo ID), se actualizará</li>
                      <li>Los productos nuevos se agregarán al inventario</li>
                      <li>
                        <Button
                          variant="link"
                          onClick={downloadTemplate}
                          className="p-0 h-auto text-[#12F3D5] hover:text-[#12F3D5]/80"
                        >
                          Descargar plantilla CSV
                        </Button>
                      </li>
                    </ul>
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="file"
                      accept=".csv"
                      ref={fileInputRef}
                      onChange={importFromCSV}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#12F3D5] hover:bg-[#12F3D5]/80 text-gray-900"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Seleccionar archivo CSV
                    </Button>
                  </div>
                  {importProgress > 0 && (
                    <div className="mt-4">
                      <Progress value={importProgress} className="h-2 bg-gray-700" />
                      <p className="text-xs text-gray-400 mt-1 text-center">{importProgress}% completado</p>
                    </div>
                  )}
                </>
              ) : (
                <Alert
                  className={
                    importStatus.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"
                  }
                >
                  <AlertCircle className={importStatus.success ? "h-4 w-4 text-green-500" : "h-4 w-4 text-red-500"} />
                  <AlertTitle className={importStatus.success ? "text-green-500" : "text-red-500"}>
                    {importStatus.success ? "Importación exitosa" : "Error en la importación"}
                  </AlertTitle>
                  <AlertDescription className="text-gray-300 mt-2">
                    <p>{importStatus.message}</p>
                    {importStatus.details && (
                      <div className="mt-2 text-xs bg-black/30 p-2 rounded max-h-32 overflow-y-auto">
                        {importStatus.details}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  setIsImportDialogOpen(false)
                  setImportStatus(null)
                  setImportProgress(0)
                }}
                className={
                  importStatus?.success
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }
              >
                {importStatus?.success ? "Cerrar" : "Cancelar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
