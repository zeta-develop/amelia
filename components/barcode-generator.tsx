"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

interface BarcodeGeneratorProps {
  value: string
  width?: number
  height?: number
  format?: string
  displayValue?: boolean
  className?: string
}

export function BarcodeGenerator({
  value,
  width = 2,
  height = 100,
  format = "CODE128",
  displayValue = true,
  className = "",
}: BarcodeGeneratorProps) {
  const barcodeRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (barcodeRef.current && value) {
      try {
        JsBarcode(barcodeRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 10,
          background: "transparent",
          lineColor: "#12F3D5", // Nuevo color turquesa
          font: "monospace",
          fontSize: 16,
          textMargin: 2,
        })
      } catch (error) {
        console.error("Error generating barcode:", error)
      }
    }
  }, [value, width, height, format, displayValue])

  if (!value) {
    return null
  }

  return <svg ref={barcodeRef} className={className}></svg>
}
