export function formatPrice(cents: number) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  })
    .format(cents)
    .replace(/\u202f/g, ' ');
  return `${formatted} F`;
}
