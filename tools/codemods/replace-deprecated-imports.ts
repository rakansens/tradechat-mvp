/**
 * tools/codemods/replace-deprecated-imports.ts
 * 作成: T-7.4フェーズ - 非推奨インポートを自動置換するjscodemodeスクリプト
 * 更新: T-7.5フェーズ - 型チェックを改善し、マッピングを拡張
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
  'IndicatorState': '@/types/store/chart/indicator',
  'DrawingToolState': '@/types/store/chart/drawingTool',
  'RealTimeState': '@/types/store/chart/realtime',
  'MarketState': '@/types/store/market',
  'StoreFilterOptions': '@/types/store/symbol',
  'FilterOptions': '@/types/store/symbol',
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
  'TradeSide': '@/types/constants/enums',

  // 追加の型マッピング - エラー解決のため
  'BaseEntry': '@/types/entry/base',
  'OpenEntry': '@/types/entry/base',
  'ClosedEntry': '@/types/entry/base',
  'CanceledEntry': '@/types/entry/base',
  'Entry': '@/types/entry/base',
  'EntryState': '@/types/entry/state',
  'EntryStatus': '@/types/constants/enums',
  'SymbolListProps': '@/types/common/symbol',
};

/**
 * 旧パスと新パスのマッピング
 */
const PATH_TRANSFORM_MAP: Record<string, string> = {
  '@/types/common-interfaces': '@/types/common/interfaces',
  '@/types/common': '@/types/common/index',
  '@/utils/supabase': '@/lib/supabase',
  '@/types/store': '@/types/store/index', // 循環参照解消のため
  '@/types': '@/types/index',  // 直接の@/typesインポートを解消
  '@/store/useSymbolStore': '@/store/symbol',
  '@/store/useDebugStore': '@/store/debug',
  '@/store/useChartDataStore': '@/store/chart/data',
  '@/types/orderbook': '@/types/common/orderbook',
  '@/styles/colors': '@/styles/theme',
  '../useLogs': '../utils/useLogs',
  '../useDebugPolling': '../utils/useDebugPolling',
  '../../types/orderbook': '@/types/common/orderbook',
  '@/app/signin/page': '@/app/(auth)/signin/page',
  '@/lib/supabase/supabase': '@/lib/supabase',
  '../../store/useSymbolStore': '@/store/symbol',
  '../../store/chart': '@/store/chart/index',
  '@/store/socketActions': '@/store/socket/actions',
  '../../../store/socketActions': '@/store/socket/actions',
  '@/services/symbol/symbol-service': '@/services/symbol',
  '@/components/ui/spinner': '@/components/ui/loading-spinner',
  '../socket-service': '@/services/socket/index',
  './supabase': '@/lib/supabase/client',
  '../useDebugStores': '@/hooks/debug/utils/useDebugStores',
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
      const toModify = specifiers.filter(spec => {
        return spec.type === 'ImportSpecifier' && 
               spec.imported && 
               'name' in spec.imported &&
               typeof spec.imported.name === 'string' &&
               spec.imported.name in TYPE_IMPORT_MAP;
      });
      
      // 変換不要の型を特定する
      const toKeep = specifiers.filter(spec => {
        return !(spec.type === 'ImportSpecifier' && 
                spec.imported && 
                'name' in spec.imported &&
                typeof spec.imported.name === 'string' &&
                spec.imported.name in TYPE_IMPORT_MAP);
      });
      
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
          if (spec.type === 'ImportSpecifier' && 
              spec.imported && 
              'name' in spec.imported && 
              typeof spec.imported.name === 'string') {
            
            const importName = spec.imported.name;
            if (importName in TYPE_IMPORT_MAP) {
              const newPath = TYPE_IMPORT_MAP[importName];
              
              if (!importByPath[newPath]) {
                importByPath[newPath] = [];
              }
              
              importByPath[newPath].push(importName);
            }
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
    
  // @/types/store からの特定インポートを修正（例：@/types/store → @/types/store/chart）
  root
    .find(j.ImportDeclaration)
    .filter(path => {
      const importPath = path.node.source.value as string;
      return importPath === '@/types/store';
    })
    .forEach(path => {
      const specifiers = path.node.specifiers || [];
      
      // 変換が必要な型を特定する
      const toModify = specifiers.filter(spec => {
        return spec.type === 'ImportSpecifier' && 
               spec.imported && 
               'name' in spec.imported &&
               typeof spec.imported.name === 'string' &&
               spec.imported.name in TYPE_IMPORT_MAP;
      });
      
      // 変換不要の型を特定する
      const toKeep = specifiers.filter(spec => {
        return !(spec.type === 'ImportSpecifier' && 
                spec.imported && 
                'name' in spec.imported &&
                typeof spec.imported.name === 'string' &&
                spec.imported.name in TYPE_IMPORT_MAP);
      });
      
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
          if (spec.type === 'ImportSpecifier' && 
              spec.imported && 
              'name' in spec.imported &&
              typeof spec.imported.name === 'string') {
            
            const importName = spec.imported.name;
            if (importName in TYPE_IMPORT_MAP) {
              const newPath = TYPE_IMPORT_MAP[importName];
              
              if (!importByPath[newPath]) {
                importByPath[newPath] = [];
              }
              
              importByPath[newPath].push(importName);
            }
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