export function parseFlexibleDate(input: string): Date {
  const trimmed = input.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return new Date(trimmed);
  }

  const slashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const [, y, m, d] = slashMatch;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  return new Date(trimmed);
}
