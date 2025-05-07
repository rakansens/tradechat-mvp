#!/bin/bash
# apply-migrations.sh
# Supabaseマイグレーションを適用するスクリプト
# 作成日: 2025/5/7
# 更新日: 2025/5/7 - Supabaseプロジェクト情報を設定

# エラーが発生したら停止
set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルプメッセージ
function show_help {
  echo -e "${BLUE}Supabaseマイグレーション適用スクリプト${NC}"
  echo ""
  echo "使用方法: $0 [オプション]"
  echo ""
  echo "オプション:"
  echo "  -h, --help       ヘルプメッセージを表示"
  echo "  -l, --local      ローカル環境にマイグレーションを適用"
  echo "  -r, --remote     リモート環境にマイグレーションを適用"
  echo "  -d, --dry-run    ドライランモード（実際には適用しない）"
  echo ""
  echo "例:"
  echo "  $0 --local       ローカル環境にマイグレーションを適用"
  echo "  $0 --remote      リモート環境にマイグレーションを適用"
  echo ""
}

# デフォルト値
LOCAL=false
REMOTE=false
DRY_RUN=false
PROJECT_REF="wqhkevngqjipjohshble"

# 引数がない場合はヘルプを表示
if [ $# -eq 0 ]; then
  show_help
  exit 1
fi

# 引数の解析
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_help
      exit 0
      ;;
    -l|--local)
      LOCAL=true
      shift
      ;;
    -r|--remote)
      REMOTE=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo -e "${RED}エラー: 不明なオプション '$1'${NC}"
      show_help
      exit 1
      ;;
  esac
done

# ローカルとリモートの両方が指定された場合はエラー
if [ "$LOCAL" = true ] && [ "$REMOTE" = true ]; then
  echo -e "${RED}エラー: --localと--remoteは同時に指定できません${NC}"
  exit 1
fi

# どちらも指定されていない場合はエラー
if [ "$LOCAL" = false ] && [ "$REMOTE" = false ]; then
  echo -e "${RED}エラー: --localまたは--remoteを指定してください${NC}"
  exit 1
fi

# プロジェクトルートディレクトリに移動
cd "$(dirname "$0")/.."

# Supabase CLIがインストールされているか確認
if ! command -v supabase &> /dev/null; then
  echo -e "${RED}エラー: Supabase CLIがインストールされていません${NC}"
  echo -e "インストール方法: ${YELLOW}npm install -g supabase${NC}"
  exit 1
fi

# マイグレーションファイルをコピー
echo -e "${BLUE}マイグレーションファイルを準備しています...${NC}"
mkdir -p supabase/migrations
cp -r migrations/supabase/* supabase/migrations/

# マイグレーションの適用
if [ "$LOCAL" = true ]; then
  echo -e "${BLUE}ローカル環境にマイグレーションを適用します...${NC}"
  
  # ローカルのSupabaseが起動しているか確認
  if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}ローカルのSupabaseが起動していません。起動します...${NC}"
    supabase start
  fi
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}ドライランモード: マイグレーションは適用されません${NC}"
    supabase db diff --use-migra
  else
    echo -e "${GREEN}マイグレーションを適用しています...${NC}"
    supabase db reset
    echo -e "${GREEN}マイグレーションが正常に適用されました${NC}"
  fi
elif [ "$REMOTE" = true ]; then
  echo -e "${BLUE}リモート環境にマイグレーションを適用します...${NC}"
  
  # プロジェクト参照IDの設定
  echo -e "${BLUE}プロジェクト参照ID: ${PROJECT_REF}${NC}"
  
  # リモート環境の確認
  if ! supabase projects list &> /dev/null; then
    echo -e "${RED}エラー: Supabaseにログインしていません${NC}"
    echo -e "ログイン方法: ${YELLOW}supabase login${NC}"
    exit 1
  fi
  
  # プロジェクトのリンク
  echo -e "${BLUE}プロジェクトをリンクしています...${NC}"
  supabase link --project-ref ${PROJECT_REF}
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}ドライランモード: マイグレーションは適用されません${NC}"
    supabase db remote diff
  else
    echo -e "${GREEN}マイグレーションを適用しています...${NC}"
    supabase db push
    echo -e "${GREEN}マイグレーションが正常に適用されました${NC}"
  fi
fi

echo -e "${BLUE}完了しました${NC}"