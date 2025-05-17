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
  // オーダーブック関連の型
  'OrderBookEntry': '@/types/common/orderbook',
  'OrderBookData': '@/types/common/orderbook',
  'OrderBookProps': '@/types/common/orderbook',
  'BitgetOrderBookResponse': '@/types/common/orderbook',
  
  // シンボル関連の型
  'SymbolInfo': '@/types/common/symbol',
  'SymbolListProps': '@/types/common/symbol',
  'BitgetSymbolsResponse': '@/types/common/symbol',
  'SymbolFilterOptions': '@/types/common/symbol',
  'FilterOptions': '@/types/common/symbol',
  
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
  
  // チャート関連の型
  'IndicatorType': '@/types/store/chart',
  'DrawingToolType': '@/types/store/chart',
  'ActiveIndicator': '@/types/store/chart',
  'OHLCData': '@/types/chart',
  
  // 列挙型
  'ExchangeType': '@/types/constants/enums',
  'ExchangeProductType': '@/types/constants/enums',
  'Timeframe': '@/types/constants/enums',
  'ChartType': '@/types/constants/enums',
  'TradeSide': '@/types/constants/enums',
  'EntryStatus': '@/types/constants/enums',

  // エントリ関連の型
  'BaseEntry': '@/types/entry/base',
  'OpenEntry': '@/types/entry/base',
  'ClosedEntry': '@/types/entry/base',
  'CanceledEntry': '@/types/entry/base',
  'Entry': '@/types/entry/base',
  'EntryState': '@/types/entry/state',
  
  // ネットワーク関連の型
  'ConnectionStatus': '@/types/network/connection',
  'SelectQueryError': '@/types/network/supabase',
  
  // ストアスライスの型
  'ChartDataSlice': '@/store/chart/data/types',
  'RealTimeSlice': '@/store/chart/realtime/types',
  'IndicatorSlice': '@/store/chart/indicator/types',
  'DrawingToolSlice': '@/store/chart/drawingTool/types',
  'ChartConfigSlice': '@/store/chart/config/types',
  'EntrySliceState': '@/store/entry/state',
  'EntrySliceActions': '@/store/entry/actions',
  'DataFetchSliceState': '@/store/datafetch/state',
};

/**
 * 旧パスと新パスのマッピング
 */
const PATH_TRANSFORM_MAP: Record<string, string> = {
  // 共通型のパス変換
  '@/types/common-interfaces': '@/types/common/interfaces',
  '@/types/common': '@/types/common/index',
  
  // オーダーブック関連のパス変換
  '@/types/orderbook': '@/types/common/orderbook',
  '@/types/chart/orderbook': '@/types/common/orderbook',
  '../../types/orderbook': '@/types/common/orderbook',
  '../../types/chart/orderbook': '@/types/common/orderbook',
  
  // シンボル関連のパス変換
  '@/types/symbol': '@/types/common/symbol',
  '@/types/chart/symbol': '@/types/common/symbol',
  '../../types/symbol': '@/types/common/symbol',
  '../../types/chart/symbol': '@/types/common/symbol',
  
  // その他のパス変換
  '@/utils/supabase': '@/lib/supabase',
  '@/types/store': '@/types/store/index',
  '@/types': '@/types/index',
  '@/store/useSymbolStore': '@/store/symbol',
  '@/store/useDebugStore': '@/store/debug',
  '@/store/useChartDataStore': '@/store/chart/data',
  '@/styles/colors': '@/styles/theme',
  '@/app/signin/page': '@/app/auth-client/signin/page',
  '@/lib/supabase/supabase': '@/lib/supabase',
  '../../store/useSymbolStore': '@/store/symbol',
  '../../store/chart': '@/store/chart/index',
  '@/store/socketActions': '@/store/socket/actions',
  '../../../store/socketActions': '@/store/socket/actions',
  '@/services/symbol/symbol-service': '@/services/symbol',
  '@/components/ui/spinner': '@/components/ui/loading-spinner',
  '../socket-service': '@/services/socket/index',
  './supabase': '@/lib/supabase/client',
  './position': '@/utils/position/position',
  './market/formatters': '@/utils/market/formatters/index',
  './position/calculations': '@/utils/position/calculations/index',
  '../types/market': '@/types/common/market',
  'vitest': 'jest',
  
  // 相対パスからの絶対パス変換
  '../useDebugStores': '@/hooks/debug/useDebugStores',
  '../useDebugPolling': '@/hooks/debug/useDebugPolling',
  '../useLogs': '@/hooks/debug/useLogs',
  '@/store': '@/store/index',
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