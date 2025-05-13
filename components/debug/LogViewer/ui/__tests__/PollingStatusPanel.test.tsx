import { render, screen } from '@testing-library/react';
import { PollingStatusPanel } from '../PollingStatusPanel';

describe('PollingStatusPanel', () => {
  it('空のポーリング状態を表示すること', () => {
    render(<PollingStatusPanel pollingStatus={{}} />);
    
    expect(screen.getByText('ポーリング状態')).toBeInTheDocument();
    expect(screen.getByText('オーダーブックポーリング')).toBeInTheDocument();
    expect(screen.getByText('市場データポーリング')).toBeInTheDocument();
    expect(screen.getAllByText('停止中').length).toBeGreaterThan(0);
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });
  
  it('アクティブなポーリング状態を正しく表示すること', () => {
    const pollingStatus = {
      orderbook: {
        active: true,
        interval: 5000,
        lastPollTime: new Date().toISOString()
      },
      marketData: {
        active: false,
        interval: 10000,
        lastPollTime: null
      }
    };
    
    render(<PollingStatusPanel pollingStatus={pollingStatus} />);
    
    expect(screen.getByText('アクティブ')).toBeInTheDocument();
    expect(screen.getByText('停止中')).toBeInTheDocument();
    expect(screen.getByText('5秒')).toBeInTheDocument();
    expect(screen.getByText('10秒')).toBeInTheDocument();
  });
}); 