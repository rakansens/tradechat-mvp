// components/chart/ui/IndicatorSelector.tsx
// UI for toggling chart indicators

import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { IndicatorType } from '@/types/store/chart'

interface IndicatorSelectorProps {
  /** Active indicator types */
  activeIndicators: IndicatorType[]
  /** Callback when an indicator is toggled */
  onToggleIndicator: (indicator: IndicatorType) => void
  /** Optional callback to clear all indicators */
  onClearAll?: () => void
  /** Optional container className */
  className?: string
}

const indicators: { id: IndicatorType; name: string }[] = [
  { id: 'rsi', name: 'RSI' },
  { id: 'macd', name: 'MACD' },
  { id: 'ichimoku', name: 'Ichimoku' },
  { id: 'bollinger', name: 'Bollinger' },
  { id: 'ema', name: 'EMA' }
]

const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
  activeIndicators,
  onToggleIndicator,
  onClearAll,
  className
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {indicators.map((indicator) => (
        <div key={indicator.id} className="flex items-center space-x-2 text-xs">
          <Checkbox
            id={`indicator-${indicator.id}`}
            checked={activeIndicators.includes(indicator.id)}
            onCheckedChange={() => onToggleIndicator(indicator.id)}
          />
          <Label htmlFor={`indicator-${indicator.id}`}>{indicator.name}</Label>
        </div>
      ))}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs text-red-400 hover:text-red-300"
        >
          Clear All
        </button>
      )}
    </div>
  )
}

export default IndicatorSelector
