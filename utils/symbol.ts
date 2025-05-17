export function splitSymbol(symbol: string): [string, string] {
  const commonQuotes = ['USDT', 'BUSD', 'USDC', 'USD', 'BTC', 'ETH', 'BNB'];
  const upper = symbol.toUpperCase();

  for (const quote of commonQuotes) {
    if (upper.endsWith(quote) && upper.length > quote.length) {
      const base = upper.slice(0, upper.length - quote.length);
      return [base, quote];
    }
  }

  if (upper.includes('/')) {
    const [base, quote] = upper.split('/');
    return [base, quote];
  }

  const base = upper.slice(0, -4);
  const quote = upper.slice(-4);

  if (base.length === 0) {
    return [upper.slice(0, -3), upper.slice(-3)];
  }

  return [base, quote];
}

export function normalizeSymbol(symbol: string, separator: string = ''): string {
  if (!symbol) return '';

  const cleaned = symbol.replace(/"/g, '');

  if (cleaned.includes('/')) {
    const [base, quote] = cleaned.split('/');
    return `${base.toUpperCase()}${separator}${quote.toUpperCase()}`;
  }

  if (cleaned.includes('-')) {
    const [base, quote] = cleaned.split('-');
    return `${base.toUpperCase()}${separator}${quote.toUpperCase()}`;
  }

  const [base, quote] = splitSymbol(cleaned);
  return `${base.toUpperCase()}${separator}${quote.toUpperCase()}`;
}
