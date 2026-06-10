"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n/language-provider";

interface DeleteLessonPlanButtonProps {
  lessonPlanId: string;
  lessonTitle: string;
}

export function DeleteLessonPlanButton({
  lessonPlanId,
  lessonTitle,
}: DeleteLessonPlanButtonProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      t("lessonPlans.deleteConfirm", { title: lessonTitle })
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/lesson-plans/${lessonPlanId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(result.error || t("lessonPlans.deleteError"));
        }

        toast.success(t("lessonPlans.deleteSuccess"));
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("lessonPlans.deleteError"));
      }
    });
  };

  return (
    <DropdownMenuItem
      className="text-destructive"
      disabled={isPending}
      onSelect={(event) => {
        event.preventDefault();
        handleDelete();
      }}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isPending ? t("common.deleting") : t("common.delete")}
    </DropdownMenuItem>
  );
}
