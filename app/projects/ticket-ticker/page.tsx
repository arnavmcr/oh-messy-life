import type { Metadata } from 'next';
import { getTicketRecords } from '@/lib/ticket-ticker';
import TicketTickerChart from '@/components/TicketTickerChart';

export const metadata: Metadata = {
  title: 'Ticket Ticker — oh messy life',
  description:
    "India's concert resale market visualised — demand, seller loss %, and pricing across 180+ events and 7k+ WhatsApp listings.",
};

export default function TicketTickerPage() {
  const records = getTicketRecords();

  return (
    <main className="max-w-5xl mx-auto px-8 py-16">

      {/* Metadata strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-50">
          projects / ticket ticker
        </span>
        <span className="stamp-green font-mono text-[9px] uppercase tracking-widest font-bold">
          ACTIVE
        </span>
      </div>

      {/* Header */}
      <h1 className="font-headline text-5xl font-black uppercase">Ticket Ticker</h1>
      <div className="h-1 w-24 bg-primary my-4" />
      <p className="font-body italic opacity-70 max-w-2xl">
        India&apos;s concert resale market, seen through WhatsApp. Each bubble is an event —
        plotted by buy demand (X), average seller loss % (Y), and average ticket price (size).
        Hover or tap a bubble for details. Filter by event or date range below.
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest opacity-40 mt-3">
        Source: 16k+ WhatsApp listings · Nov 2023 – Jun 2026 · Mumbai-focused groups
      </p>

      {/* Chart */}
      <div className="mt-10">
        <TicketTickerChart records={records} />
      </div>

    </main>
  );
}
