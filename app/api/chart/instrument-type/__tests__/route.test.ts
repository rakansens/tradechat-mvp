// app/api/chart/instrument-type/__tests__/route.test.ts
// 取引タイプ（現物/先物）変更APIエンドポイントのテスト
// 作成: 2025-05-08 - WebSocketベースの環境に対応

import { POST } from '../route';
import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

// モック
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// NextResponseのモック
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      data,
      ...options
    }))
  }
}));

describe('Instrument Type API Endpoint', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // グローバルのemitSocketEventをモック化
    global.emitSocketEvent = jest.fn().mockResolvedValue({
      success: true,
      clientCount: 1
    });
  });
  
  it('should successfully change instrument type to spot', async () => {
    // リクエストの作成
    const request = {
      json: jest.fn().mockResolvedValue({ type: 'spot' })
    } as unknown as Request;
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).toHaveBeenCalledWith(
      'instrument-type-change',
      { type: 'spot' }
    );
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        message: '取引タイプを現物に変更しました',
        type: 'spot'
      }
    );
    
    expect(logger.info).toHaveBeenCalled();
  });
  
  it('should successfully change instrument type to futures', async () => {
    // リクエストの作成
    const request = {
      json: jest.fn().mockResolvedValue({ type: 'futures' })
    } as unknown as Request;
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).toHaveBeenCalledWith(
      'instrument-type-change',
      { type: 'futures' }
    );
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: true,
        message: '取引タイプを先物に変更しました',
        type: 'futures'
      }
    );
    
    expect(logger.info).toHaveBeenCalled();
  });
  
  it('should handle invalid instrument type', async () => {
    // リクエストの作成（無効な取引タイプ）
    const request = {
      json: jest.fn().mockResolvedValue({ type: 'invalid' })
    } as unknown as Request;
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).not.toHaveBeenCalled();
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: '無効な取引タイプです。"spot"または"futures"を指定してください'
      },
      { status: 400 }
    );
    
    expect(logger.warn).toHaveBeenCalled();
  });
  
  it('should handle missing instrument type', async () => {
    // リクエストの作成（取引タイプなし）
    const request = {
      json: jest.fn().mockResolvedValue({})
    } as unknown as Request;
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).not.toHaveBeenCalled();
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: '無効な取引タイプです。"spot"または"futures"を指定してください'
      },
      { status: 400 }
    );
    
    expect(logger.warn).toHaveBeenCalled();
  });
  
  it('should handle socket emit failure', async () => {
    // リクエストの作成
    const request = {
      json: jest.fn().mockResolvedValue({ type: 'spot' })
    } as unknown as Request;
    
    // ソケットエミットの失敗をモック
    global.emitSocketEvent = jest.fn().mockResolvedValue({
      success: false,
      error: 'Socket connection error'
    });
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).toHaveBeenCalledWith(
      'instrument-type-change',
      { type: 'spot' }
    );
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: 'Socket connection error'
      },
      { status: 500 }
    );
    
    expect(logger.warn).toHaveBeenCalled();
  });
  
  it('should handle JSON parsing error', async () => {
    // リクエストの作成（JSONパースエラー）
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    } as unknown as Request;
    
    // APIエンドポイントを呼び出し
    const response = await POST(request);
    
    // 検証
    expect(global.emitSocketEvent).not.toHaveBeenCalled();
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: '取引タイプ変更処理中にエラーが発生しました'
      },
      { status: 500 }
    );
    
    expect(logger.error).toHaveBeenCalled();
  });
});
