/**
 * __tests__/components/chat/section/ui/InputForm.test.tsx
 * InputFormコンポーネントのテストスイート
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { InputForm } from '@/components/chat/section/ui/InputForm';

// InputBoxコンポーネントをモック
jest.mock('@/components/chat/InputBox', () => {
  return {
    __esModule: true,
    default: (props: any) => 
      React.createElement('input', {
        type: 'text',
        'data-testid': 'mock-input',
        value: props.value,
        onChange: props.onChange,
        placeholder: props.placeholder,
        className: props.className
      })
  };
});

describe('InputForm', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });
  
  test('入力値が正しく表示されること', () => {
    render(
      React.createElement(InputForm, { 
        value: 'Test message', 
        onChange: mockOnChange, 
        onSubmit: mockOnSubmit
      })
    );
    
    const inputElement = screen.getByTestId('mock-input');
    expect(inputElement).toHaveValue('Test message');
  });
  
  test('onChange関数が呼ばれること', () => {
    render(
      React.createElement(InputForm, { 
        value: 'Test message', 
        onChange: mockOnChange, 
        onSubmit: mockOnSubmit
      })
    );
    
    const inputElement = screen.getByTestId('mock-input');
    fireEvent.change(inputElement, { target: { value: 'New message' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });
  
  test('空の入力でsubmitした場合、onSubmitは呼ばれること', () => {
    render(
      React.createElement(InputForm, { 
        value: '', 
        onChange: mockOnChange, 
        onSubmit: mockOnSubmit
      })
    );
    
    const formElement = screen.getByRole('form');
    fireEvent.submit(formElement);
    
    expect(mockOnSubmit).toHaveBeenCalled();
    // フォームコンポーネントは入力のトリムチェックを行わない（送信ハンドラー側で行う）
  });
  
  test('送信ボタンをクリックするとonSubmitが呼ばれること', () => {
    render(
      React.createElement(InputForm, { 
        value: 'Test message', 
        onChange: mockOnChange, 
        onSubmit: mockOnSubmit
      })
    );
    
    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalled();
  });
}); 