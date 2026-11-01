import type { SubmissionStatus } from "@shared/constants";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/common";

/** Status of a scenario submission: "Awaiting review" or the graded score. */
export function SubmissionStatusBadge({ status, score, passed }: { status: SubmissionStatus; score: number | null; passed: boolean | null }) {
  if (status === "submitted") {
    return (
      <Badge variant="outline" className="border-amber-500/50 font-normal text-amber-400">
        Awaiting review
      </Badge>
    );
  }
  return <ScoreBadge score={score} passed={passed} />;
}
