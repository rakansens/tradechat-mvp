/**
 * tools/codemods/replace-deprecated-imports.ts
 * 作成: T-7.4フェーズ - 非推奨インポートを自動置換するjscodemodeスクリプト
 * 
 * このスクリプトは、jscodemodeを使用して非推奨のインポートパスを新しいパスに置換します。
 * 特にtypes/index.tsから循環参照を引き起こす可能性のあるインポートを修正します。
 * 
 * 使用方法:
 *   npx jscodeshift -t tools/codemods/replace-deprecated-imports.ts [対象ファイル/ディレクトリ] --extensions=ts,tsx
 * 
 * 例:
 *   npx jscodeshift -t tools/codemods/replace-deprecated-imports.ts src --extensions=ts,tsx
 */

import { API, FileInfo, Options } from 'jscodeshift';

// 型定義の変換マップ
const TYPE_IMPORT_MAP: Record<string, string> = {
  // store型の変換マップ
  'AppState': '@/types/store/app',
  'UIState': '@/types/store/ui',
  'TabType': '@/types/store/ui',
  'ChartDataState': '@/types/store/chart',
  'ChartConfigState': '@/types/store/chart',
  'IndicatorState': '@/types/store/chart',
  'DrawingToolState': '@/types/store/chart',
  'RealTimeState': '@/types/store/chart',
  'MarketState': '@/types/store/market',
  'StoreFilterOptions': '@/types/store',
  'FilterOptions': '@/types/store',
  'IndicatorType': '@/types/store/chart',
  'ActiveIndicator': '@/types/store/chart',
  'DrawingToolType': '@/types/store/chart',
  
  // 共通型の変換マップ
  'SymbolInfo': '@/types/common/symbol',
  'OrderBookEntry': '@/types/common/orderbook',
  
  // その他の型
  'ExchangeType': '@/types/constants/enums',
  'ExchangeProductType': '@/types/constants/enums',
  'Timeframe': '@/types/constants/enums',
  'ChartType': '@/types/constants/enums',
  'OHLCData': '@/types/chart',
};

/**
 * 旧パスと新パスのマッピング
 */
const PATH_TRANSFORM_MAP: Record<string, string> = {
  '@/types/common-interfaces': '@/types/common/interfaces',
  '@/types/common': '@/types/common/index',
  '@/utils/supabase': '@/lib/supabase',
};

export default function transformer(file: FileInfo, api: API, options: Options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let hasModifications = false;

  // import { AppState } from '@/types'; のような形式を検出して修正
  root
    .find(j.ImportDeclaration)
    .filter(path => {
      const importPath = path.node.source.value as string;
      return importPath === '@/types';
    })
    .forEach(path => {
      const specifiers = path.node.specifiers || [];
      
      // 変換が必要な型を特定する
      const toModify = specifiers.filter(spec => 
        spec.type === 'ImportSpecifier' && 
        spec.imported && 
        TYPE_IMPORT_MAP[spec.imported.name]
      );
      
      // 変換不要の型を特定する
      const toKeep = specifiers.filter(spec => 
        !(spec.type === 'ImportSpecifier' && 
        spec.imported && 
        TYPE_IMPORT_MAP[spec.imported.name])
      );
      
      if (toModify.length > 0) {
        hasModifications = true;
        
        // 元のインポート文から変換対象の型を除外
        if (toKeep.length > 0) {
          path.node.specifiers = toKeep;
        } else {
          // 全ての型が変換対象なら元のインポート文を削除
          j(path).remove();
        }
        
        // 新しいインポートパスでグループ化
        const importByPath: Record<string, string[]> = {};
        
        toModify.forEach(spec => {
          if (spec.type === 'ImportSpecifier' && spec.imported) {
            const importName = spec.imported.name;
            const newPath = TYPE_IMPORT_MAP[importName];
            
            if (!importByPath[newPath]) {
              importByPath[newPath] = [];
            }
            
            importByPath[newPath].push(importName);
          }
        });
        
        // 新しいインポート文を作成して追加
        Object.entries(importByPath).forEach(([newPath, importNames]) => {
          const newImport = j.importDeclaration(
            importNames.map(name => 
              j.importSpecifier(j.identifier(name))
            ),
            j.stringLiteral(newPath)
          );
          
          path.insertAfter(newImport);
        });
      }
    });
    
  // 非推奨のパスを修正（例：@/types/common-interfaces → @/types/common/interfaces）
  root
    .find(j.ImportDeclaration)
    .filter(path => {
      const importPath = path.node.source.value as string;
      return Object.keys(PATH_TRANSFORM_MAP).some(oldPath => importPath === oldPath);
    })
    .forEach(path => {
      const importPath = path.node.source.value as string;
      const newPath = PATH_TRANSFORM_MAP[importPath];
      
      if (newPath) {
        hasModifications = true;
        path.node.source.value = newPath;
      }
    });

  return hasModifications ? root.toSource() : file.source;
} 