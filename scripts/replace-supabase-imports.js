#!/usr/bin/env node

/**
 * Supabase関連のインポートパス置換スクリプト
 * 作成日: 2025-06-19
 * 
 * utils/supabase/* を lib/supabase/* に置換します
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// リポジトリ内のJavaScript/TypeScriptファイル一覧を取得
function getJsFiles() {
  try {
    const output = execSync('git ls-files "*.ts" "*.tsx" "*.js" "*.jsx"').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return [];
  }
}

// ファイル内の import 文を置換
function replaceImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // utils/supabase の import を置換
    const newContent = content
      .replace(/from ['"]@\/utils\/supabase\/(.*)['"]/g, 'from \'@/lib/supabase/$1\'')
      .replace(/from ['"]utils\/supabase\/(.*)['"]/g, 'from \'lib/supabase/$1\'')
      .replace(/import\s+(['"])@\/utils\/supabase\/(.*)(['"])/g, 'import $1@/lib/supabase/$2$3')
      .replace(/import\s+(['"])utils\/supabase\/(.*)(['"])/g, 'import $1lib/supabase/$2$3')
      .replace(/require\(['"]@\/utils\/supabase\/(.*)['"]\)/g, 'require(\'@/lib/supabase/$1\')')
      .replace(/require\(['"]utils\/supabase\/(.*)['"]\)/g, 'require(\'lib/supabase/$1\')');

    // 変更があった場合のみファイルを更新
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ 更新: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`エラー (${filePath}):`, error);
    return false;
  }
}

// メイン処理
function main() {
  console.log('Supabaseインポートパス置換処理を開始...');
  
  const files = getJsFiles();
  console.log(`処理対象ファイル数: ${files.length}`);
  
  let updatedCount = 0;
  
  for (const file of files) {
    if (replaceImportsInFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n完了! ${updatedCount} ファイルを更新しました。`);
}

main(); 