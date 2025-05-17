#!/bin/bash
# migration-helpers.sh
# リファクタリング作業をサポートするユーティリティスクリプト

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプメッセージ
function show_help {
  echo -e "${BLUE}使用方法:${NC} ./scripts/migration-helpers.sh [コマンド]"
  echo ""
  echo "利用可能なコマンド:"
  echo -e "  ${GREEN}check-imports${NC}        - 古いパスへの参照を検索"
  echo -e "  ${GREEN}update-imports${NC}       - インポートパスを新しい構造に更新"
  echo -e "  ${GREEN}check-circular${NC}       - 循環参照をチェック"
  echo -e "  ${GREEN}clean-old-files${NC}      - 古いファイルを削除（注意：慎重に使用）"
  echo ""
}

# 古いパスへの参照を検索
function check_imports {
  echo -e "${YELLOW}==== 古いパスへの参照を検索中... ====${NC}"
  
  echo -e "${BLUE}utils/date.ts への参照:${NC}"
  grep -r "from ['\"].*utils/date['\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${BLUE}utils/format.ts への参照:${NC}"
  grep -r "from ['\"].*utils/format['\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${BLUE}utils/logger.ts への参照:${NC}"
  grep -r "from ['\"].*utils/logger['\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${BLUE}utils/chartUtils.ts への参照:${NC}"
  grep -r "from ['\"].*utils/chartUtils['\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${BLUE}lib/validations/ への参照:${NC}"
  grep -r "from ['\"].*lib/validations['\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${BLUE}lib/supabase-*.ts への参照:${NC}"
  grep -r "from ['\"].*lib/supabase-[^\"]" --include="*.ts" --include="*.tsx" src/ | wc -l
  
  echo -e "${YELLOW}==== 検索完了 ====${NC}"
}

# インポートパスを更新
function update_imports {
  echo -e "${YELLOW}==== インポートパスを更新中... ====${NC}"
  
  # utils/common/
  echo -e "${BLUE}utils/date.ts → utils/common${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/utils/date['\"]|from '@/utils/common'|g" {} \;
  
  echo -e "${BLUE}utils/format.ts → utils/common${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/utils/format['\"]|from '@/utils/common'|g" {} \;
  
  echo -e "${BLUE}utils/logger.ts → utils/common${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/utils/common['\"]|from '@/utils/common'|g" {} \;
  
  # utils/chart/
  echo -e "${BLUE}utils/chartUtils.ts → utils/chart${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/utils/chartUtils['\"]|from '@/utils/chart'|g" {} \;
  
  echo -e "${BLUE}utils/indicatorFactory.ts → utils/chart${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/utils/indicatorFactory['\"]|from '@/utils/chart'|g" {} \;
  
  # lib/supabase/
  echo -e "${BLUE}lib/supabase-*.ts → lib/supabase${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/lib/supabase-|from '@/lib/supabase/supabase-|g" {} \;
  
  # validations
  echo -e "${BLUE}lib/validations/ → types/validations${NC}"
  find src -type f -name "*.ts*" -exec sed -i '' "s|from ['\"]@/lib/validations/|from '@/types/validations/|g" {} \;
  
  echo -e "${YELLOW}==== 更新完了 ====${NC}"
}

# 循環参照をチェック
function check_circular {
  echo -e "${YELLOW}==== 循環参照をチェック中... ====${NC}"
  
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}エラー: npx が見つかりません。Node.js がインストールされていることを確認してください。${NC}"
    exit 1
  fi
  
  if ! npx madge --version &> /dev/null; then
    echo -e "${BLUE}madge をインストール中...${NC}"
    npm install -D madge
  fi
  
  echo -e "${BLUE}循環参照をチェック:${NC}"
  npx madge --circular src
  
  echo -e "${YELLOW}==== チェック完了 ====${NC}"
}

# 古いファイルを削除
function clean_old_files {
  echo -e "${RED}警告: この操作は元に戻せません。古いファイルを削除します。${NC}"
  echo -e "${YELLOW}続行しますか？ (y/n)${NC}"
  read -p "" confirm
  
  if [[ $confirm != "y" ]]; then
    echo -e "${BLUE}操作をキャンセルしました。${NC}"
    return
  fi
  
  echo -e "${YELLOW}==== 古いファイルを削除中... ====${NC}"
  
  # 各ファイルの存在を確認してから削除
  files=(
    "utils/date.ts"
    "utils/format.ts" 
    "utils/logger.ts"
    "utils/chartUtils.ts"
    "utils/indicatorFactory.ts"
    "utils/chart.ts"
    "utils/indicators.ts"
    "utils/chartIndicatorUtils.ts"
    "utils/price.ts"
    "utils/orderbook-utils.ts"
    "utils/tradeUtils.ts"
    "utils/position.ts"
    "utils/positionUtils.ts"
  )
  
  for file in "${files[@]}"; do
    if [ -f "$file" ]; then
      echo -e "${BLUE}削除: $file${NC}"
      rm "$file"
    else
      echo -e "${YELLOW}スキップ: $file (ファイルが存在しません)${NC}"
    fi
  done
  
  echo -e "${YELLOW}==== 削除完了 ====${NC}"
}

# コマンドを処理
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  "check-imports")
    check_imports
    ;;
  "update-imports")
    update_imports
    ;;
  "check-circular")
    check_circular
    ;;
  "clean-old-files")
    clean_old_files
    ;;
  "help"|"-h"|"--help")
    show_help
    ;;
  *)
    echo -e "${RED}エラー: 不明なコマンド '$1'${NC}"
    show_help
    exit 1
    ;;
esac

exit 0 