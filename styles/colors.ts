// TradingView風の洗練されたカラーテーマ
// 目に優しく、コントラスト比の高い配色

// カラートークンの薄いラッパー
// ✅ 今後は極力直接インポートしない想定
// 更新: 2025-06-28 - Tailwind CSSユーティリティクラスを返すように変更

export const theme = {
  // 背景色
  background: {
    primary: 'bg-background-primary',
    secondary: 'bg-background-secondary',
    tertiary: 'bg-background-tertiary',
    card: 'bg-background-card',
    elevated: 'bg-background-elevated',
  },
  
  // テキスト色
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    disabled: 'text-text-disabled',
  },
  
  // アクセント色 (Tailwindで直接使うことができないため、値を残す)
  accent: {
    blue: 'var(--color-accent-blue)',
    lightBlue: 'var(--color-accent-lightBlue)',
    green: 'var(--color-accent-green)',
    red: 'var(--color-accent-red)',
    yellow: 'var(--color-accent-yellow)',
    purple: 'var(--color-accent-purple)',
  },
  
  // 境界線
  border: {
    light: 'border-border-light',
    dark: 'border-border-dark',
    highlight: 'border-border-highlight',
  },
  
  // グラデーション (Tailwindで直接使うことができないため、値を残す)
  gradient: {
    blue: 'linear-gradient(135deg, var(--color-accent-blue) 0%, var(--color-accent-lightBlue) 100%)',
    profit: 'linear-gradient(135deg, var(--color-accent-green) 0%, #80CBC4 100%)',
    loss: 'linear-gradient(135deg, var(--color-accent-red) 0%, #FF8A80 100%)',
  },
  
  // チャート特有の色
  chart: {
    grid: 'bg-chart-grid',
    upCandle: 'text-chart-upCandle',
    downCandle: 'text-chart-downCandle',
    line: 'stroke-chart-line',
    crosshair: 'stroke-chart-crosshair',
    volume: {
      up: 'bg-opacity-30 bg-chart-upCandle',
      down: 'bg-opacity-30 bg-chart-downCandle',
    },
  },
};
