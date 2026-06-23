import { JournalForm } from "@/components/JournalForm";
import { getJournalForDate } from "@/lib/db";
import { todayISO } from "@/lib/stats";

export default async function JournalPage() {
  const today = todayISO();
  const todayJournal = await getJournalForDate(today);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">Journal</h1>
        <p className="text-[var(--muted)] mt-2">
          Write your market thoughts, P&L reflections, and mindset notes. Wendy retrieves these
          with RAG to coach you better over time.
        </p>
      </header>

      <JournalForm initial={todayJournal} />
    </div>
  );
}
