"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

export interface EditorWizardStep {
  id: string;
  label: string;
  shortLabel?: string;
}

interface EditorWizardProps {
  steps: EditorWizardStep[];
  currentStep: string;
  onStepChange?: (stepId: string) => void;
  className?: string;
}

export function EditorWizard({
  steps,
  currentStep,
  onStepChange,
  className,
}: EditorWizardProps) {
  const { t } = useI18n();
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn("w-full", className)}>
      <div className="hidden sm:flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isDone = index < currentIndex;
          const clickable = onStepChange && (isDone || isActive);

          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepChange?.(step.id)}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  isActive && "border-primary bg-primary/5 text-primary",
                  isDone && "border-primary/30 text-primary",
                  !isActive && !isDone && "border-border text-muted-foreground",
                  clickable && "hover:bg-accent cursor-pointer",
                  !clickable && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    isActive || isDone ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="truncate font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 ? (
                <div className="hidden h-px w-4 shrink-0 bg-border lg:block" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t("editor.wizardStep", { current: currentIndex + 1, total: steps.length })}
          </span>
          <span className="font-medium text-foreground">
            {steps[currentIndex]?.shortLabel ?? steps[currentIndex]?.label}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export const EDITOR_WIZARD_STEP_IDS = ["basic", "content", "research", "review"] as const;
