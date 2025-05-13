/**
 * __tests__/components/chat/InputForm.test.tsx
 * InputFormコンポーネントのテストスイート
 */

import { render, fireEvent, screen } from '@testing-library/react';
import { InputForm } from '@/components/chat/section/ui/InputForm';

describe('InputForm', () => {
  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });
  
  test('入力値が正しく表示されること', () => {
    render(
      <InputForm 
        value="Test message" 
        onChange={mockOnChange} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const inputElement = screen.getByPlaceholderText('Ask about the market...');
    expect(inputElement).toHaveValue('Test message');
  });
  
  test('onChange関数が呼ばれること', () => {
    render(
      <InputForm 
        value="Test message" 
        onChange={mockOnChange} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const inputElement = screen.getByPlaceholderText('Ask about the market...');
    fireEvent.change(inputElement, { target: { value: 'New message' } });
    
    expect(mockOnChange).toHaveBeenCalled();
  });
  
  test('空の入力でsubmitした場合、onSubmitは呼ばれるがフォーム内での検証はトリムが関数側で行われる', () => {
    render(
      <InputForm 
        value="" 
        onChange={mockOnChange} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const formElement = screen.getByRole('form');
    fireEvent.submit(formElement);
    
    expect(mockOnSubmit).toHaveBeenCalled();
    // フォームコンポーネントは入力のトリムチェックを行わない（送信ハンドラー側で行う）
  });
  
  test('送信ボタンをクリックするとonSubmitが呼ばれること', () => {
    render(
      <InputForm 
        value="Test message" 
        onChange={mockOnChange} 
        onSubmit={mockOnSubmit} 
      />
    );
    
    const submitButton = screen.getByRole('button');
    fireEvent.click(submitButton);
    
    expect(mockOnSubmit).toHaveBeenCalled();
  });
}); 