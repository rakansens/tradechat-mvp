"use client"

// components/chat/ui/SystemPromptEditor.tsx
// システムプロンプト編集コンポーネント
// 作成日: 2025/6/2

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { SaveIcon, RotateCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SystemPromptEditorProps {
  conversationId: string;
  initialPrompt?: string | null;
  onSave?: (prompt: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

/**
 * システムプロンプト編集コンポーネント
 * 
 * 会話のシステムプロンプトを編集するUIを提供します。
 */
export default function SystemPromptEditor({
  conversationId,
  initialPrompt = "",
  onSave,
  onCancel,
  isModal = false
}: SystemPromptEditorProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();
  
  // 初期プロンプトまたは会話IDが変更されたら状態を更新
  useEffect(() => {
    setPrompt(initialPrompt || "");
    setIsDirty(false);
  }, [initialPrompt, conversationId]);
  
  // プロンプト変更ハンドラー
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setIsDirty(true);
  };
  
  // プロンプト保存処理
  const savePrompt = async () => {
    if (!isDirty) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_prompt: prompt,
          // タイトルも必要なので、既存のタイトルを維持する空のパラメータを送信
          title: " " // APIはこれを無視し、既存のタイトルを維持します
        }),
      });
      
      if (!response.ok) {
        throw new Error("システムプロンプトの保存に失敗しました");
      }
      
      setIsDirty(false);
      toast({
        title: "保存完了",
        description: "システムプロンプトが保存されました",
      });
      
      if (onSave) onSave(prompt);
    } catch (error) {
      console.error("システムプロンプト保存エラー:", error);
      toast({
        title: "エラー",
        description: "システムプロンプトの保存に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // キャンセル処理
  const handleCancel = () => {
    setPrompt(initialPrompt || "");
    setIsDirty(false);
    if (onCancel) onCancel();
  };
  
  // モーダル表示の場合
  if (isModal) {
    return (
      <Card 
        className="w-full max-w-md border rounded-md shadow-md bg-background-secondary"
      >
        <CardHeader className="p-4 border-b border-border-light">
          <CardTitle className="text-lg font-medium">システムプロンプトの編集</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Textarea
              placeholder="AIアシスタントの動作を制御するシステムプロンプトを入力..."
              value={prompt}
              onChange={handlePromptChange}
              className="min-h-[150px] resize-y bg-slate-800 border-slate-700 bg-background-tertiary"
            />
            <p className="text-xs text-muted-foreground">
              会話の性質や制約を決定する指示をAIに与えます。変更内容は会話全体に適用されます。
            </p>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t flex justify-end space-x-2 border-border-light">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            disabled={isSaving}
          >
            キャンセル
          </Button>
          <Button 
            variant="default" 
            onClick={savePrompt}
            disabled={!isDirty || isSaving}
          >
            {isSaving ? <RotateCw className="h-4 w-4 mr-1 animate-spin" /> : <SaveIcon className="h-4 w-4 mr-1" />}
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // インライン表示の場合
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">システムプロンプト</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={savePrompt}
          disabled={!isDirty || isSaving}
          className="h-7 text-xs border-slate-700 hover:bg-slate-700"
        >
          {isSaving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : <SaveIcon className="h-3.5 w-3.5 mr-1" />}
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
      
      <Textarea
        placeholder="AIアシスタントの動作を制御するシステムプロンプトを入力..."
        value={prompt}
        onChange={handlePromptChange}
        className="min-h-[100px] resize-y bg-slate-800 border-slate-700 bg-background-tertiary"
      />
      
      <p className="text-xs text-muted-foreground">
        会話の性質や制約を決定する指示をAIに与えます。変更後は保存してください。
      </p>
    </div>
  );
} 