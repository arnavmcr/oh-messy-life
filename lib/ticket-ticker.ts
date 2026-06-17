import fs from 'fs';
import path from 'path';

export interface TicketRecord {
  event: string;
  location: string | null;
  type: 'BUY' | 'SELL';
  price: number | null;
  original_price_inferred: number | null;
  price_inference_source: 'explicit' | 'dataset' | 'price_map' | null;
  message_date: string;
  event_date: string | null;
  num_tickets: number | null;
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
