import { render, screen } from '@testing-library/react';
import { FetchesPanel } from '../FetchesPanel';

describe('FetchesPanel', () => {
  it('アクティブなフェッチがない場合に空のメッセージを表示すること', () => {
    render(<FetchesPanel activeFetches={[]} requestHistory={[]} />);
    
    expect(screen.getByText('アクティブなリクエストはありません')).toBeInTheDocument();
    expect(screen.getByText('リクエスト履歴はありません')).toBeInTheDocument();
  });
  
  it('アクティブなフェッチリクエストを正しく表示すること', () => {
    const activeFetches = [
      { type: 'orderbook', symbol: 'BTCUSDT', exchangeType: 'spot', duration: 1500 }
    ];
    
    render(<FetchesPanel activeFetches={activeFetches} requestHistory={[]} />);
    
    expect(screen.getByText('orderbook')).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('spot')).toBeInTheDocument();
    expect(screen.getByText('1秒')).toBeInTheDocument();
  });
  
  it('リクエスト履歴を正しく表示すること', () => {
    const requestHistory = [
      { key: 'api/market/BTCUSDT', status: 'completed', duration: 250 },
      { key: 'api/orderbook/ETHUSDT', status: 'error', duration: 150 }
    ];
    
    render(<FetchesPanel activeFetches={[]} requestHistory={requestHistory} />);
    
    expect(screen.getByText('api/market/BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('api/orderbook/ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText('250ms')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
  });
}); 