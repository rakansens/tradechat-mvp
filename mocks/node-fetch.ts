/**
 * node-fetch のモック
 * テスト環境で使用するための簡易的な node-fetch の代替実装
 */

// 簡易的な Response 型定義
export interface Response {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  json(): Promise<any>;
  text(): Promise<string>;
}

// 簡易的な Headers クラス
export class Headers {
  private headers: Record<string, string> = {};

  constructor(init?: Record<string, string>) {
    if (init) {
      Object.keys(init).forEach(key => {
        this.headers[key.toLowerCase()] = init[key];
      });
    }
  }

  append(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }

  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  has(name: string): boolean {
    return name.toLowerCase() in this.headers;
  }
}

// fetch 関数のモック
export default async function fetch(url: string, options: any = {}): Promise<Response> {
  // テスト用のダミー実装
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: async () => ({}),
    text: async () => ''
  };
}
