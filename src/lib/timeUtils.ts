/**
 * Format times like "9:00PM" => "9PM". Works across ranges too.
 */
export const formatTimeDisplay = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  let out = timeStr;
  // Remove :00 before AM/PM (e.g., 9:00 PM -> 9 PM)
  out = out.replace(/:00(?=\s*(?:AM|PM|am|pm)\b)/g, "");
  // Remove trailing :00 for 24h formats (e.g., 21:00 -> 21)
  out = out.replace(/:00(?!\d)/g, "");
  // Uppercase am/pm
  out = out.replace(/\b(am|pm)\b/g, (m) => m.toUpperCase());
  return out;
};

/**
 * Parse time string and return minutes since midnight.
 * If a range is provided, uses the ending part.
 */
export const parseTimeToMinutes = (timeStr?: string | null): number | null => {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();
  // if a range provided, use the ending part
  const parts = clean.split(/\s*(?:-|–|—|to)\s*/);
  const target = parts.length > 1 ? parts[parts.length - 1] : clean;

  const m12 = target.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = m12[2] ? parseInt(m12[2], 10) : 0;
    const ap = m12[3].toLowerCase();
    if (ap === 'pm' && h !== 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + min;
  }

  const m24 = target.match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (m24) {
    const h = parseInt(m24[1], 10);
    const min = m24[2] ? parseInt(m24[2], 10) : 0;
    if (h >= 0 && h < 24 && min >= 0 && min < 60) return h * 60 + min;
  }

  return null;
};
