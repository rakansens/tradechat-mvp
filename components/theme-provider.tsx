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
  const { theme, setTheme, forcedTheme } = useTheme()
  
  // UIスライスのダークモード状態
  const isDarkMode = useRootStore(selectIsDarkMode)
  const layoutClass = useRootStore(selectLayoutClass)
  const setDarkMode = useRootStore((state) => state.setDarkMode)
  
  // next-themesからZustandの状態に同期（一方向のみ）
  React.useEffect(() => {
    // forcedThemeが設定されている場合は同期しない
    if (forcedTheme) return;
    
    // テーマが変更された時だけ実行
    if (theme === 'dark' && !isDarkMode) {
      setDarkMode(true)
    } else if (theme === 'light' && isDarkMode) {
      setDarkMode(false)
    }
  }, [theme, isDarkMode, setDarkMode, forcedTheme])
  
  // Zustandの状態が変更された場合のみテーマを反映（一方向のみ）
  // この部分はforcedThemeが設定されている場合は実行しない
  React.useEffect(() => {
    // forcedThemeが設定されている場合は同期しない
    if (forcedTheme) return;
    
    // 現在のテーマと異なる場合のみ更新
    const targetTheme = isDarkMode ? 'dark' : 'light';
    if (theme !== targetTheme) {
      setTheme(targetTheme);
    }
  }, [isDarkMode, setTheme, theme, forcedTheme])
  
  // レイアウトクラスの適用
  React.useEffect(() => {
    const htmlElement = document.documentElement
    
    // darkクラスが存在するか確認し、保持する
    const hasDarkClass = htmlElement.classList.contains('dark')
    
    // layoutClassを追加
    htmlElement.classList.add(layoutClass)
    
    // darkクラスが既に設定されていた場合は維持する
    if (hasDarkClass && !htmlElement.classList.contains('dark')) {
      htmlElement.classList.add('dark')
    }
    
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
