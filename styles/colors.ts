// TradingView風の洗練されたカラーテーマ
// 目に優しく、コントラスト比の高い配色

export const theme = {
  // 背景色
  background: {
    primary: '#151924', // メイン背景色 - より目に優しいダークトーン
    secondary: '#1c2030', // セカンダリ背景色
    tertiary: '#242838', // テキスト入力や選択項目の背景
    card: '#1E222D',     // カード背景
    elevated: '#2a2e3d', // やや明るい背景（ホバー状態など）
  },
  
  // テキスト色
  text: {
    primary: '#E0E3EB',   // 主要テキスト - より白に近く読みやすい
    secondary: '#A7B0C4', // 二次的なテキスト
    muted: '#6B7A98',     // 弱めのテキスト
    disabled: '#4D5575',  // 無効化されたテキスト
  },
  
  // アクセント色
  accent: {
    blue: '#2962FF',     // プライマリアクセント - より明るいブルー
    lightBlue: '#5B8AF9', // ホバー状態のブルー
    green: '#26A69A',    // 買い/ロング/成功
    red: '#EF5350',      // 売り/ショート/エラー
    yellow: '#F9A825',   // 警告
    purple: '#9B59B6',   // 特殊機能
  },
  
  // 境界線
  border: {
    light: '#2A2E39',    // 明るい境界線
    dark: '#1F2333',     // 暗い境界線
    highlight: '#374151', // 強調された境界線
  },
  
  // グラデーション
  gradient: {
    blue: 'linear-gradient(135deg, #2962FF 0%, #5B8AF9 100%)',
    profit: 'linear-gradient(135deg, #26A69A 0%, #80CBC4 100%)',
    loss: 'linear-gradient(135deg, #EF5350 0%, #FF8A80 100%)',
  },
  
  // チャート特有の色
  chart: {
    grid: '#242838',
    upCandle: '#26A69A',
    downCandle: '#EF5350',
    volume: {
      up: 'rgba(38, 166, 154, 0.3)',
      down: 'rgba(239, 83, 80, 0.3)',
    },
    line: '#2962FF',
    area: 'rgba(41, 98, 255, 0.1)',
    crosshair: '#6B7A98',
  },
};
