/**
 * components/symbol/Selector/ui/SearchBar.tsx
 * 銘柄検索バーコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 */

"use client";

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearch: (term: string) => void;
}

/**
 * 銘柄検索バーコンポーネント
 * 
 * 検索アイコン付きの入力フィールドとクリアボタンを提供します。
 */
export const SearchBar = ({
  searchTerm,
  onSearch
}: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="銘柄を検索..."
        value={searchTerm}
        onChange={(e) => onSearch(e.target.value)}
        className="pl-8 pr-8"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={() => onSearch('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default SearchBar; 