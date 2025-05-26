import { formatCurrency } from "@/lib/utils";

interface InventorySummaryProps {
  totalBuyValue: number;
  totalSellValue: number;
  potentialProfit: number;
}

export function InventorySummary({ totalBuyValue, totalSellValue, potentialProfit }: InventorySummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-lg bg-[#12F3D5]/10 p-4 border border-[#12F3D5]/20">
        <h3 className="text-sm font-medium text-[#12F3D5]/70 mb-1">Valor Total de Compra</h3>
        <p className="text-xl font-bold text-[#12F3D5]">{formatCurrency(totalBuyValue)}</p>
      </div>
      <div className="rounded-lg bg-[#12F3D5]/10 p-4 border border-[#12F3D5]/20">
        <h3 className="text-sm font-medium text-[#12F3D5]/70 mb-1">Valor Total de Venta</h3>
        <p className="text-xl font-bold text-[#12F3D5]">{formatCurrency(totalSellValue)}</p>
      </div>
      <div className="rounded-lg bg-[#12F3D5]/10 p-4 border border-[#12F3D5]/20">
        <h3 className="text-sm font-medium text-[#12F3D5]/70 mb-1">Ganancia Potencial</h3>
        <p className="text-xl font-bold text-[#12F3D5]">{formatCurrency(potentialProfit)}</p>
      </div>
    </div>
  );
}
