/**
 * styles/colors.ts - カラーテーマ定義（スタブ実装）
 * @deprecated TailwindCSSの標準カラートークンを使用してください
 */

// Tailwindカラー変数を使用するため、以下は参照のみのスタブ実装です
// 新規コードではtailwind.config.tsのtheme.colorsを使用してください

export const colors = {
  // 基本カラー
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  
  // テキストカラー
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
  },
  
  // 背景カラー
  background: {
    primary: 'var(--color-background-primary)',
    secondary: 'var(--color-background-secondary)',
    tertiary: 'var(--color-background-tertiary)',
  },
  
  // ボーダーカラー
  border: {
    light: 'var(--color-border-light)',
    default: 'var(--color-border)',
    dark: 'var(--color-border-dark)',
  },
  
  // アクセントカラー
  green: 'var(--color-accent-green)',
  red: 'var(--color-accent-red)',
  blue: 'var(--color-accent-blue)',
  yellow: 'var(--color-accent-yellow)',
  
  // 状態カラー
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',
};

export default colors; 