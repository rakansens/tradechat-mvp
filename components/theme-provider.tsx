'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps as NextThemeProviderProps,
} from 'next-themes'
import { useRootStore } from '@/store'
import { selectIsDarkMode, selectLayoutClass } from '@/store/barrel'

// 拡張したThemeProviderProps
interface ThemeProviderProps extends NextThemeProviderProps {
  children: React.ReactNode
}

// NextThemesProviderラッパーコンポーネント
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSynchronizer>{children}</ThemeSynchronizer>
    </NextThemesProvider>
  )
}

// Zustandストアとnext-themesを同期させるコンポーネント
const ThemeSynchronizer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // next-themesのテーマ
  const { theme, setTheme } = useTheme()
  
  // UIスライスのダークモード状態
  const isDarkMode = useRootStore(selectIsDarkMode)
  const layoutClass = useRootStore(selectLayoutClass)
  const setDarkMode = useRootStore((state) => state.setDarkMode)
  
  // next-themesとZustandの状態を同期
  React.useEffect(() => {
    if (theme === 'dark' && !isDarkMode) {
      setDarkMode(true)
    } else if (theme === 'light' && isDarkMode) {
      setDarkMode(false)
    }
  }, [theme, isDarkMode, setDarkMode])
  
  // ZustandからNext.jsテーマに反映
  React.useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light')
  }, [isDarkMode, setTheme])
  
  // レイアウトクラスの適用
  React.useEffect(() => {
    const htmlElement = document.documentElement
    htmlElement.classList.add(layoutClass)
    
    return () => {
      htmlElement.classList.remove(layoutClass)
    }
  }, [layoutClass])
  
  return (
    <>
      {children}
      
      {/* テーマ切り替えボタン（オプション - UIに移動しても良い） */}
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          aria-label="テーマ切り替え"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </>
  )
}
