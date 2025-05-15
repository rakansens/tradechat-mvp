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

// コマンドライン引数を解析
const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');

// リポジトリ内のJavaScript/TypeScriptファイル一覧を取得
function getJsFiles() {
  try {
    const output = execSync('git ls-files \"*.ts\" \"*.tsx\" \"*.js\" \"*.jsx\"').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    return [];
  }
}

// ファイル内の import 文を置換
function replaceImportsInFile(filePath, checkOnly = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // utils/supabase の import を置換
    const newContent = content
      .replace(/from ['\"]@\/utils\/supabase\/(.*)['\"]/g, 'from \'@/lib/supabase/$1\'')
      .replace(/from ['\"]utils\/supabase\/(.*)['\"]/g, 'from \'lib/supabase/$1\'')
      .replace(/import\(['\"]@\/utils\/supabase\/(.*)['\"]\)/g, 'import(\'@/lib/supabase/$1\')')
      .replace(/import\(['\"]utils\/supabase\/(.*)['\"]\)/g, 'import(\'lib/supabase/$1\')');
    
    // 変更がある場合のみ処理
    if (content !== newContent) {
      if (checkOnly) {
        console.error(`旧パスの参照が検出されました: ${filePath}`);
        return false;
      } else {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`更新: ${filePath}`);
      }
    }
    return true;
  } catch (error) {
    console.error(`エラー (${filePath}):`, error);
    return false;
  }
}

// メイン処理
function main() {
  const files = getJsFiles();
  console.log(`${files.length}個のファイルを処理します...`);
  
  let success = true;
  let updatedCount = 0;

  for (const file of files) {
    const result = replaceImportsInFile(file, checkOnly);
    if (!result) {
      success = false;
    } else if (!checkOnly && result !== true) {
      updatedCount++;
    }
  }

  if (checkOnly) {
    if (!success) {
      console.error('旧パスの参照が見つかりました。修正が必要です。');
      process.exit(1);
    } else {
      console.log('すべてのファイルが新しいパスを使用しています。');
    }
  } else {
    console.log(`処理完了: ${updatedCount}個のファイルを更新しました。`);
  }
}

main(); 