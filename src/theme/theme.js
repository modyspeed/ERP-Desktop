export const THEME_COLORS = [
  { id: 'blue', name: 'أزرق كلاسيكي', hex: '#2563eb', light: '#dbeafe', hover: '#1d4ed8' },
  { id: 'indigo', name: 'نيلي ملكي', hex: '#4f46e5', light: '#e0e7ff', hover: '#4338ca' },
  { id: 'emerald', name: 'زمردي أنيق', hex: '#059669', light: '#d1fae5', hover: '#047857' },
  { id: 'violet', name: 'بنفسجي راقٍ', hex: '#7c3aed', light: '#ede9fe', hover: '#6d28d9' },
  { id: 'orange', name: 'برتقالي متوهج', hex: '#ea580c', light: '#ffedd5', hover: '#c2410c' },
  { id: 'rose', name: 'وردي عصري', hex: '#e11d48', light: '#ffe4e6', hover: '#be123c' },
];

export const DEFAULT_THEME_COLOR = '#2563eb';

export const DEFAULT_FONT_FAMILY = 'Cairo';

// Fallbacks appended after the chosen font so Latin/missing glyphs still render.
const FONT_FALLBACKS = "'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function buildFontStack(fontFamily) {
  if (!fontFamily) return null;
  // Avoid listing the chosen face twice when it is already the first fallback.
  const fallbacks = fontFamily === 'Cairo'
    ? "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : FONT_FALLBACKS;
  return `'${fontFamily}', ${fallbacks}`;
}
