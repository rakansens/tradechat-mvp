export interface OHLCData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface Entry {
  id: string
  side: "buy" | "sell"
  symbol: string
  price: number
  time: string
  takeProfit?: number
  stopLoss?: number
  status?: "open" | "closed" | "canceled"
  exitPrice?: number
  exitTime?: string
  profit?: number
}

export interface ChartMarker {
  time: number
  position: "aboveBar" | "belowBar" | "inBar"
  color: string
  shape: "circle" | "square" | "arrowUp" | "arrowDown"
  text: string
  size: number
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
