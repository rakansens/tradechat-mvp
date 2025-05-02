"use client"

import type { Entry } from "@/types"
import { ArrowUpRight, ArrowDownRight, X, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react"
import { formatDate, calculateProfit, calculateProfitPercentage } from "@/utils/positionUtils"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

interface PositionHistoryProps {
  entries: Entry[]
  onClosePosition: (entryId: string, exitPrice: number) => void
  onCancelPosition: (entryId: string) => void
}

export default function PositionHistory({ entries, onClosePosition, onCancelPosition }: PositionHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<"open" | "closed">("open")

  // Simulate current price (in a real app, would use market price)
  const getCurrentPrice = (entryPrice: number) => {
    // Simulate random price movement (±5%)
    const randomChange = (Math.random() - 0.5) * 0.1
    return entryPrice * (1 + randomChange)
  }

  // Close position handler
  const handleClosePosition = (entry: Entry) => {
    const currentPrice = getCurrentPrice(entry.price)
    onClosePosition(entry.id, currentPrice)
  }

  // Filter entries based on selected tab
  const filteredEntries = entries.filter((entry) =>
    selectedTab === "open" ? entry.status === "open" : entry.status === "closed",
  )

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Position History</CardTitle>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "open" | "closed")}>
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="open" className="text-xs px-3 py-1 h-8">
              Open
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs px-3 py-1 h-8">
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-3 overflow-y-auto">
        {filteredEntries.length === 0 ? (
          <EmptyState selectedTab={selectedTab} />
        ) : (
          <PositionList
            entries={filteredEntries}
            handleClosePosition={handleClosePosition}
            onCancelPosition={onCancelPosition}
            getCurrentPrice={getCurrentPrice}
          />
        )}
      </CardContent>

      {selectedTab === "closed" && filteredEntries.length > 0 && (
        <>
          <Separator />
          <CardFooter className="p-3">
            <PositionSummary entries={filteredEntries} />
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Empty state component
function EmptyState({ selectedTab }: { selectedTab: "open" | "closed" }) {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground h-[200px]">
      {selectedTab === "open" ? "No open positions" : "No closed positions"}
    </div>
  )
}

// Position list component
function PositionList({
  entries,
  handleClosePosition,
  onCancelPosition,
  getCurrentPrice,
}: {
  entries: Entry[]
  handleClosePosition: (entry: Entry) => void
  onCancelPosition: (id: string) => void
  getCurrentPrice: (price: number) => number
}) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const profit = calculateProfit(entry, getCurrentPrice)
        const profitPercentage = calculateProfitPercentage(entry, profit)
        const isProfitable = profit > 0

        return (
          <Card key={entry.id} className="overflow-hidden">
            <div className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    {entry.side === "buy" ? (
                      <Badge variant="success" className="flex items-center mb-1">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        <span className="font-bold">{entry.symbol} LONG</span>
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex items-center mb-1">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        <span className="font-bold">{entry.symbol} SHORT</span>
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Entry: ${entry.price.toLocaleString()} ({formatDate(entry.time)})
                  </div>
                  {entry.status === "closed" && entry.exitPrice && entry.exitTime && (
                    <div className="text-xs text-muted-foreground">
                      Exit: ${entry.exitPrice.toLocaleString()} ({formatDate(entry.exitTime)})
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold ${isProfitable ? "text-green-500" : "text-red-500"} flex items-center justify-end`}
                  >
                    {isProfitable ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {profit > 0 ? "+" : ""}${Math.abs(profit).toFixed(2)} ({profitPercentage.toFixed(2)}%)
                  </div>
                  {entry.status === "open" && (
                    <div className="flex mt-2 justify-end">
                      <Button
                        onClick={() => handleClosePosition(entry)}
                        variant={isProfitable ? "success" : "destructive"}
                        size="sm"
                        className="mr-1 h-7 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                      <Button
                        onClick={() => onCancelPosition(entry.id)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  {entry.status === "open" && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1 justify-end">
                      <Clock className="h-3 w-3 mr-1" />
                      Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Position summary component
function PositionSummary({ entries }: { entries: Entry[] }) {
  const totalProfit = calculateTotalProfit(entries)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Total P/L:</span>
        <span className={`font-bold ${totalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
          {totalProfit > 0 ? "+" : ""}${Math.abs(totalProfit).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-xs text-muted-foreground">Win Rate:</span>
        <span className="text-xs font-medium">{calculateWinRate(entries)}%</span>
      </div>
    </div>
  )
}

// Calculate total profit
function calculateTotalProfit(entries: Entry[]): number {
  return entries.reduce((total, entry) => {
    if (entry.profit !== undefined) {
      return total + entry.profit
    }
    return total
  }, 0)
}

// Calculate win rate
function calculateWinRate(entries: Entry[]): number {
  if (entries.length === 0) return 0

  const winningTrades = entries.filter((entry) => entry.profit !== undefined && entry.profit > 0).length
  return Math.round((winningTrades / entries.length) * 100)
}
