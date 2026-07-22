import React from "react";
import type { TroubleshootingScenario } from "@/data/faqData";
import { AlertCircle, Wrench } from "lucide-react";

interface TroubleshootingCardProps {
  scenario: TroubleshootingScenario;
}

export const TroubleshootingCard: React.FC<TroubleshootingCardProps> = ({
  scenario,
}) => {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#1B2436] bg-[#0C1220]/80 p-6 flex flex-col hover:border-[#4FE0C8]/40 transition-colors duration-300">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 100% 0%, rgba(79,224,200,0.1), transparent 55%)",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="font-necosmic font-semibold text-xl text-[#E7EBF3] mb-4">
          {scenario.problem}
        </h3>
        
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-technical-data text-[#FFB020] mb-2 tracking-wider">
            <AlertCircle className="w-4 h-4" />
            LIKELY CAUSE
          </div>
          <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0">
            {scenario.likelyCause}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-[#1B2436]/70">
          <div className="flex items-center gap-2 text-xs font-technical-data text-[#4FE0C8] mb-2 tracking-wider">
            <Wrench className="w-4 h-4" />
            SUGGESTED FIX
          </div>
          <p className="font-body-ui text-sm text-[#8892A6] leading-relaxed m-0">
            {scenario.suggestedFix}
          </p>
        </div>
      </div>
    </article>
  );
};
