/**
 * 外部ライブラリとの統合用の型定義
 * 
 * このファイルは外部ライブラリ（OpenAI、React Day Picker、Mastraなど）との
 * 統合に必要な型定義を集約しています。
 * 
 * T-3フェーズで types/external-libs.ts から移動されました。
 */

/**
 * OpenAI関連の型定義
 * 参考: https://github.com/openai/openai-node/blob/master/src/resources/chat/completions.ts
 */
export namespace OpenAI {
  export type ChatCompletionTool = {
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: {
        type: "object";
        properties: Record<string, any>;
        required?: string[];
      };
    };
  };

  export type ChatCompletionMessage = {
    role: "system" | "user" | "assistant" | "function";
    content: string;
    name?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
  };

  export type ChatCompletionOptions = {
    model: string;
    messages: ChatCompletionMessage[];
    temperature?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    max_tokens?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    tools?: ChatCompletionTool[];
  };
}

/**
 * React Day Picker関連の型定義
 * 参考: https://github.com/gpbl/react-day-picker/blob/main/src/types/props.ts
 */
export namespace ReactDayPicker {
  export type IconProps = {
    className?: string;
    onClick?: () => void;
  };

  // 実際のライブラリの型定義と互換性を持たせるための型定義
  export interface CustomComponents {
    IconLeft?: React.ComponentType<IconProps>;
    IconRight?: React.ComponentType<IconProps>;
    // 必要に応じて他のコンポーネントも追加
  }
  
  // DayPickerのcomponentsプロパティに渡せる型
  export type DayPickerComponents = Partial<CustomComponents>;
}

/**
 * Mastra API関連の型定義
 */
export namespace MastraAPI {
  export type AgentResponse = {
    text?: string;
    content?: string;
    [key: string]: any;
  };
}

// 必要に応じて他のライブラリの型定義も追加 