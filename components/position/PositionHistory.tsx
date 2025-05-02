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
  // IMPORTANT: Avoid Math.random() during SSR to prevent hydration mismatch.
  const getCurrentPrice = (entryPrice: number) => {
    if (typeof window === "undefined") {
      // On the server, return the entry price so markup is deterministic
      return entryPrice
    }

    // Client-side only: random change ±5%
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
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none bg-[#1E222D]">
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b border-[#2A2E39]">
        <CardTitle className="text-base font-medium text-[#E0E3EB]">Position History</CardTitle>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "open" | "closed")}>
          <TabsList className="grid grid-cols-2 h-7 bg-[#242838] border border-[#2A2E39]">
            <TabsTrigger 
              value="open" 
              className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
            >
              Open
            </TabsTrigger>
            <TabsTrigger 
              value="closed" 
              className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
            >
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto p-0 bg-[#1E222D]">
        {filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[#6B7A98] text-sm">
              {selectedTab === "open" ? "No open positions." : "No closed positions."}
            </p>
          </div>
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
    <div className="h-full flex items-center justify-center">
      <p className="text-[#616471] text-sm">
        {selectedTab === "open" ? "No open positions." : "No closed positions."}
      </p>
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
  onCancelPosition: (entryId: string) => void
  getCurrentPrice: (price: number) => number
}) {
  return (
    <div className="space-y-3 p-3 bg-[#1E222D]">
      {entries.map((entry) => {
        const profit = calculateProfit(entry, getCurrentPrice)
        const profitPercentage = calculateProfitPercentage(entry, profit)
        const isProfitable = profit > 0

        return (
          <Card key={`${entry.id}-${entry.time}`} className="overflow-hidden bg-[#242838] border-[#2A2E39]">
            <div className="p-3">
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={entry.side === "buy" ? "success" : "destructive"} 
                  className="px-2 py-1 bg-opacity-20 border border-opacity-50"
                >
                  {entry.side === "buy" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {entry.side === "buy" ? "LONG" : "SHORT"}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-[#E0E3EB]">
                    ${entry.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {entry.status === "closed" && entry.exitPrice && entry.exitTime && (
                    <div>
                      <div className="font-medium text-[#A7B0C4]">Exit Price:</div>
                      <div className="text-sm text-[#E0E3EB]">
                        ${entry.exitPrice?.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-bold ${isProfitable ? "text-green-500" : "text-red-500"} flex items-center justify-end`}
                >
                  {isProfitable ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {profit > 0 ? "+" : ""}${Math.abs(profit).toFixed(2)} ({profitPercentage.toFixed(2)}%)
                </div>
                {entry.status === "open" && (
                  <div className="border-t border-[#2A2E39] p-3 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-[#242838] border-[#2A2E39] hover:bg-[#2a2e3d] text-[#A7B0C4]"
                      onClick={() => onCancelPosition(entry.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="text-xs bg-[#2962FF] hover:bg-[#5B8AF9]"
                      onClick={() => handleClosePosition(entry)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Close
                    </Button>
                  </div>
                )}
                {entry.status === "open" && (
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs bg-[#242838] border-[#374151] text-[#A7B0C4]">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(entry.time)}
                    </Badge>
                  </div>
                )}
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
      <div className="border-t border-[#2A2E39] p-3 flex justify-between items-center">
        <div>
          <div className="text-sm text-[#A7B0C4]">Profit/Loss:</div>
          <div className={`font-bold ${totalProfit >= 0 ? "text-[#26A69A]" : "text-[#EF5350]"}`}>
            {totalProfit > 0 ? "+" : ""}${Math.abs(totalProfit).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-muted-foreground">Win Rate:</span>
          <span className="text-xs font-medium">{calculateWinRate(entries)}%</span>
        </div>
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
