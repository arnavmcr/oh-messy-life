import fs from 'fs';
import path from 'path';

export interface TicketRecord {
  event: string;
  type: 'BUY' | 'SELL';
  price: number | null;
  originalPrice: number | null;
  message_date: string;
  category: string | null;
}

const DATA_FILE = path.join(process.cwd(), 'content', 'ticket-ticker.json');

export function getTicketRecords(): TicketRecord[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  const parsed: unknown[] = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed as TicketRecord[];
}
