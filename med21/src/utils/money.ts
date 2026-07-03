export const formatAedWhole = (value: number | string | null | undefined): string => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return '0';
  }
  return String(Math.round(numericValue));
};
