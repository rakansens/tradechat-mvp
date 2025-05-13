// store/core/selectors.ts
// 初期実装: reselectを使ったメモ化セレクター作成ヘルパー

import { createSelector } from 'reselect'

/**
 * メモ化されたセレクター関数を作成するヘルパー
 * @param selector 元となるセレクター関数
 * @returns メモ化されたセレクター関数
 */
export const createMemoSelector = <State, Result>(
  selector: (state: State) => Result
) => {
  return createSelector(
    (state: State) => state,
    selector
  )
}

/**
 * 複数の入力セレクターを組み合わせてメモ化されたセレクターを作成する
 * @param selectors 入力セレクター関数の配列
 * @param resultFunc セレクター関数の結果を組み合わせる関数
 * @returns メモ化されたセレクター関数
 */
export const createComposedSelector = <State, Result, SelectedValues extends any[]>(
  selectors: Array<(state: State) => any>,
  resultFunc: (...args: SelectedValues) => Result
) => {
  return createSelector(
    selectors,
    (...args: SelectedValues) => resultFunc(...args)
  )
} 