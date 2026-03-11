import { useState } from "react";
import { Lightbulb, ShieldAlert, BookOpen, Award, Target, HeartPulse, HelpCircle, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Recommendation } from "@/lib/recommendations";

const priorityConfig: Record<Recommendation['priority'], { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  high: { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low: { label: 'LOW', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

const categoryIcons: Record<Recommendation['category'], typeof Lightbulb> = {
  performance: Target,
  training: BookOpen,
  qualification: Award,
  readiness: ShieldAlert,
  safety: HeartPulse,
  question: HelpCircle,
  workforce: Users,
};

const priorityOrder: Record<Recommendation['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

interface RecommendationButtonProps {
  recommendations: Recommendation[];
  label?: string;
  context: string;
}

export default function RecommendationButton({ recommendations, label = "Recommend", context }: RecommendationButtonProps) {
  const [open, setOpen] = useState(false);

  const sorted = [...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const hasCritical = sorted.some(r => r.priority === 'critical');
  const hasHigh = sorted.some(r => r.priority === 'high');

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={`gap-1.5 text-xs font-medium border transition-colors ${
          hasCritical
            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300'
            : hasHigh
              ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:text-orange-300'
              : recommendations.length > 0
                ? 'border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300'
                : 'border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300'
        }`}
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {label}
        {recommendations.length > 0 && (
          <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
            hasCritical ? 'bg-red-500/20 text-red-300' :
            hasHigh ? 'bg-orange-500/20 text-orange-300' :
            'bg-yellow-500/20 text-yellow-300'
          }`}>
            {recommendations.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-zinc-100">
              Recommendations — {context}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-500">
              Generated from live data using rule-based analysis. No AI involved.
            </DialogDescription>
          </DialogHeader>

          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-green-400">All Clear</h3>
              <p className="text-sm text-zinc-400 text-center max-w-sm">
                All metrics are performing within acceptable thresholds — no action required at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {sorted.map((rec, i) => {
                const pConfig = priorityConfig[rec.priority];
                const Icon = categoryIcons[rec.category] || Lightbulb;
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-4 ${pConfig.bg} ${pConfig.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 ${pConfig.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pConfig.color} ${pConfig.bg} border ${pConfig.border}`}>
                            {pConfig.label}
                          </span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                            {rec.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-100 mb-1">
                          {rec.title}
                        </h4>
                        <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                          {rec.body}
                        </p>
                        {rec.action && (
                          <p className="text-sm text-zinc-400 italic mt-2 border-t border-zinc-700/50 pt-2">
                            → {rec.action}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
