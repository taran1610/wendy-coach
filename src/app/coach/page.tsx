import { CoachPanel } from "@/components/CoachPanel";
import { getReviewForDate } from "@/lib/coach";
import { todayISO } from "@/lib/stats";

export default async function CoachPage() {
  const review = await getReviewForDate(todayISO());

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[#042f2e] font-bold text-xl">
            W
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Wendy Coach</h1>
            <p className="text-[var(--muted)]">
              Your AI trading mentor — honest, supportive, and powered by your journal history.
            </p>
          </div>
        </div>
      </header>

      <CoachPanel initialReview={review} />
    </div>
  );
}
