import { Button } from "@/components/ui/button";
import { Barcode, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Product, Category } from "@/types/product";

interface InventoryTableProps {
  products: Product[];
  categories: Category[];
  filteredProducts: Product[];
  getCategoryName: (categoryId: string) => string;
  showBarcode: (barcode: string) => void;
  handleEdit: (product: Product) => void;
  handleDelete: (id: string) => void;
  searchTerm: string;
  activeCategory: string;
}

export function InventoryTable({
  filteredProducts,
  getCategoryName,
  showBarcode,
  handleEdit,
  handleDelete,
  searchTerm,
  activeCategory,
}: InventoryTableProps) {
  return (
    <div className="rounded-lg border border-[#12F3D5]/20 overflow-x-auto w-full max-h-[500px] overflow-y-auto">
      <table className="min-w-max">
        <thead className="sticky top-0 z-10 bg-[#12F3D5]/10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Categoría</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Código</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Precio Compra</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Precio Venta</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Stock</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Total Compra</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Total Venta</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-[#12F3D5] uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-8 text-center text-gray-300">
                {searchTerm || activeCategory !== "all"
                  ? "No se encontraron productos"
                  : "No hay productos en el inventario"}
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
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-white">{product.stock}</td>
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
  );
}
