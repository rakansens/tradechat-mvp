// components/chat/messages/MessageContent.tsx
// 作成: メッセージコンテンツ表示コンポーネント
// テキスト、コード、画像など内容タイプごとの表示を担当

import { useMemo } from "react"
import Image from "next/image"
import type { ExtendedMessage } from "@/types/chat"
import { CodeBlock } from "../ui/CodeBlock"

// メッセージコンテンツの種類を表す型
type MessageContentType = 'text' | 'code' | 'image' | 'proposal'

// 構造化されたメッセージコンテンツを表す型
interface ParsedContent {
  type: MessageContentType
  content: string
  language?: string
  caption?: string
}

interface MessageContentProps {
  message: ExtendedMessage;
  isStreaming?: boolean;
}

export const MessageContent = ({ message, isStreaming = false }: MessageContentProps) => {
  // メッセージコンテンツの解析を行う
  const parsedContents = useMemo(() => {
    const contents: ParsedContent[] = []
    
    // コードブロックを解析
    const codeBlockRegex = /```([\w-]*)\n([\s\S]*?)```/g
    let lastIndex = 0
    let match
    
    // メッセージ内のすべてのコードブロックを抽出
    const messageContent = message.content || ""
    while ((match = codeBlockRegex.exec(messageContent)) !== null) {
      // コードブロック前のテキストがあれば追加
      if (match.index > lastIndex) {
        contents.push({
          type: 'text',
          content: messageContent.substring(lastIndex, match.index)
        })
      }
      
      // コードブロックを追加
      contents.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2]
      })
      
      lastIndex = match.index + match[0].length
    }
    
    // 残りのテキスト部分を追加
    if (lastIndex < messageContent.length) {
      contents.push({
        type: 'text',
        content: messageContent.substring(lastIndex)
      })
    }
    
    // 画像がある場合は画像コンテンツを追加
    if (message.imageId) {
      const port = window.location.port || '3000'
      const baseUrl = `${window.location.protocol}//${window.location.hostname}:${port}`
      const imageUrl = `${baseUrl}/api/chart-image/${message.imageId}`
      
      contents.push({
        type: 'image',
        content: imageUrl,
        caption: message.imageCaption || 'Chart analysis'
      })
    }
    
    // Markdownの画像リンクを検索 (attachment:// 形式)
    const imageRegex = /!\[([^\]]*)\]\(attachment:\/\/([^\)]+)\)/g
    const imageMatches = [...(messageContent.matchAll(imageRegex) || [])]
    
    if (imageMatches.length > 0) {
      // イメージマッチごとに画像コンテンツを追加
      imageMatches.forEach(match => {
        const [fullMatch, altText, imageId] = match
        const port = window.location.port || '3000'
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:${port}`
        const imageUrl = `${baseUrl}/api/chart-image/${imageId}`
        
        contents.push({
          type: 'image',
          content: imageUrl,
          caption: altText || 'Chart analysis'
        })
      })
    }
    
    return contents
  }, [message])
  
  if (parsedContents.length === 0) {
    return (
      <div className={`text-sm whitespace-pre-wrap break-words ${isStreaming ? 'animate-pulse' : ''}`}>
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-500 animate-blink">
            &nbsp;
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${isStreaming ? 'animate-pulse' : ''}`}>
      {parsedContents.map((content, index) => {
        switch (content.type) {
          case 'text':
            return (
              <div
                key={`text-${index}`}
                className="text-sm whitespace-pre-wrap break-words"
              >
                {content.content}
                {isStreaming && index === parsedContents.length - 1 && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-blue-500 animate-blink">
                    &nbsp;
                  </span>
                )}
              </div>
            )
            
          case 'code':
            return (
              <CodeBlock 
                key={`code-${index}`}
                code={content.content}
                language={content.language || 'plaintext'}
              />
            )
            
          case 'image':
            return (
              <div 
                key={`image-${index}`} 
                className="relative overflow-hidden rounded-md mt-2"
              >
                <div className="relative aspect-[16/9] w-full">
                  <img
                    src={content.content}
                    alt={content.caption || "Image"}
                    className="rounded-md object-contain w-full h-full"
                    onError={(e) => {
                      // エラー時の表示制御
                      e.currentTarget.style.display = 'none'
                      const errorEl = e.currentTarget.parentElement?.nextSibling as HTMLElement
                      if (errorEl) errorEl.style.display = 'block'
                    }}
                  />
                </div>
                <div 
                  className="hidden p-2 bg-gray-100 dark:bg-gray-800 rounded-md mt-2 text-sm text-muted-foreground"
                >
                  画像の読み込みに失敗しました
                </div>
                {content.caption && (
                  <p className="text-xs text-muted-foreground mt-1">{content.caption}</p>
                )}
              </div>
            )
            
          default:
            return null
        }
      })}
    </div>
  )
}
