// ParsedGigTitle is intentionally separate from GigPhoto — this pure function
// only extracts the parsed fields; the caller assembles the full GigPhoto object.
interface ParsedGigTitle {
  band: string | null;
  event: string | null;
  city: string | null;
  month: string | null;
  year: number | null;
}

export function parseGigTitle(title: string): ParsedGigTitle {
  const nullResult: ParsedGigTitle = { band: null, event: null, city: null, month: null, year: null };

  const parts = title.split(', ');
  if (parts.length !== 4) return nullResult;

  const [band, event, city, monthYear] = parts;
  const monthYearParts = monthYear.split(' ');
  if (monthYearParts.length !== 2) return nullResult;

  const [month, yearStr] = monthYearParts;
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) return nullResult;

  return { band, event, city, month, year };
}
