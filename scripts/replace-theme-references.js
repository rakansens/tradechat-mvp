/**
 * scripts/replace-theme-references.js
 * 
 * theme.オブジェクトの参照をTailwind CSSクラスに置換するスクリプト
 * 
 * 使用方法:
 * node scripts/replace-theme-references.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 置換マッピング
const replacements = {
  // 背景色
  'theme.background.primary': 'bg-background-primary',
  'backgroundColor: theme.background.primary': 'className="bg-background-primary"',
  'theme.background.secondary': 'bg-background-secondary',
  'backgroundColor: theme.background.secondary': 'className="bg-background-secondary"',
  'theme.background.tertiary': 'bg-background-tertiary',
  'backgroundColor: theme.background.tertiary': 'className="bg-background-tertiary"',
  'theme.background.card': 'bg-background-card',
  'backgroundColor: theme.background.card': 'className="bg-background-card"',
  'theme.background.elevated': 'bg-background-elevated',
  'backgroundColor: theme.background.elevated': 'className="bg-background-elevated"',
  
  // テキスト色
  'theme.text.primary': 'text-text-primary',
  'color: theme.text.primary': 'className="text-text-primary"',
  'theme.text.secondary': 'text-text-secondary',
  'color: theme.text.secondary': 'className="text-text-secondary"',
  'theme.text.muted': 'text-text-muted',
  'color: theme.text.muted': 'className="text-text-muted"',
  'theme.text.disabled': 'text-text-disabled',
  'color: theme.text.disabled': 'className="text-text-disabled"',
  
  // 境界線
  'theme.border.light': 'border-border-light',
  'borderColor: theme.border.light': 'className="border border-border-light"',
  'theme.border.dark': 'border-border-dark',
  'borderColor: theme.border.dark': 'className="border border-border-dark"',
  'theme.border.highlight': 'border-border-highlight',
  'borderColor: theme.border.highlight': 'className="border border-border-highlight"',
};

// コンポーネントディレクトリ配下のファイルを検索
const componentsDir = path.join(__dirname, '..', 'components');

// 対象ファイルを取得（theme.を含むファイル）
const getThemeRefFiles = () => {
  try {
    const result = execSync(`grep -l "theme\\." --include="*.tsx" --include="*.ts" -r ${componentsDir}`).toString();
    return result.split('\n').filter(Boolean);
  } catch (error) {
    console.error('ファイル検索エラー:', error.message);
    return [];
  }
};

// ファイル内の置換処理
const processFile = (filePath) => {
  try {
    console.log(`処理中: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // 置換処理
    for (const [oldText, newText] of Object.entries(replacements)) {
      const regex = new RegExp(oldText.replace(/\./g, '\\.'), 'g');
      
      // 置換前後で内容が変わるか確認
      const newContent = content.replace(regex, newText);
      
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`  - 置換: ${oldText} -> ${newText}`);
      }
    }
    
    // 変更があれば保存
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ 変更を保存しました`);
    } else {
      console.log(`  ℹ️ 置換対象がないか自動置換できない参照です`);
    }
  } catch (error) {
    console.error(`  ❌ 処理エラー:`, error.message);
  }
};

// メイン処理
const main = () => {
  console.log('theme.参照の置換処理を開始します...');
  
  const files = getThemeRefFiles();
  console.log(`検出された対象ファイル: ${files.length}件`);
  
  files.forEach(processFile);
  
  console.log('\n処理完了');
  console.log('注意: 複雑な置換や特殊なケースは手動で確認・修正してください');
};

main(); 