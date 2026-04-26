const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function normalizeCurrencyInput(raw: string): string {
  return raw.trim().replace(/[\s,₹]/g, '');
}

export function paiseToCurrency(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new Error('Amount must be an integer paise value');
  }

  return INR_FORMATTER.format(paise / 100);
}

export function currencyToPaise(input: string): number {
  const normalized = normalizeCurrencyInput(input);
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error('Enter a valid amount with up to 2 decimal places');
  }

  const [wholePart, fractionPart = ''] = normalized.split('.');
  const paddedFraction = fractionPart.padEnd(2, '0').slice(0, 2);
  const combined = `${wholePart}${paddedFraction}`;
  const paise = Number.parseInt(combined, 10);

  if (!Number.isSafeInteger(paise)) {
    throw new Error('Amount is too large');
  }

  return paise;
}
