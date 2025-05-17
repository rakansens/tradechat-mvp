// components/chart/ui/DrawingToolbar.tsx
// Simple toolbar for enabling drawing tools on the chart

import React from 'react'
import { cn } from '@/lib/utils'
import { PencilLine, Square, LineChart, Type as TextIcon, ArrowUpRight } from 'lucide-react'
import type { DrawingToolType } from '@/types/store/chart'

interface DrawingToolbarProps {
  /** Currently active drawing tool. null when no tool selected */
  activeTool: DrawingToolType | null
  /** Whether drawing mode is active */
  isDrawingActive: boolean
  /** Callback when a drawing tool button is clicked */
  onToggleTool: (tool: DrawingToolType) => void
  /** Optional callback for clearing all drawing data */
  onClearAll?: () => void
  /** Optional container className */
  className?: string
}

const tools: { id: DrawingToolType; name: string; icon: React.ComponentType<any> }[] = [
  { id: 'line', name: 'Line', icon: PencilLine },
  { id: 'rectangle', name: 'Rectangle', icon: Square },
  { id: 'fibonacci', name: 'Fibonacci', icon: LineChart },
  { id: 'arrow', name: 'Arrow', icon: ArrowUpRight },
  { id: 'text', name: 'Text', icon: TextIcon }
]

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  isDrawingActive,
  onToggleTool,
  onClearAll,
  className
}) => {
  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id && isDrawingActive
        return (
          <button
            key={tool.id}
            onClick={() => onToggleTool(tool.id)}
            className={cn(
              'p-1 rounded text-gray-300 hover:bg-dark-700',
              isActive && 'bg-blue-600 text-white'
            )}
            title={tool.name}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="p-1 text-xs text-red-400 hover:text-red-300"
        >
          Clear
        </button>
      )}
    </div>
  )
}

export default DrawingToolbar
