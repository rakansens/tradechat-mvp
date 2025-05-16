/**
 * モックオブジェクト用の型定義
 */

// 汎用的なモック関数の型（Jest Mockの型をラップ）
export type MockFunction<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>;

// 汎用的なモックオブジェクトの型（型Tのすべてのメソッドをモック化）
export type Mocked<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? MockFunction<T[P]>
    : T[P];
};

// 部分的なモックオブジェクトの型（型Tの一部のプロパティのみをモック化）
export type PartialMocked<T> = {
  [P in keyof T]?: T[P] extends (...args: any[]) => any
    ? MockFunction<T[P]>
    : T[P];
}; 