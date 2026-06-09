"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DeleteLessonPlanButtonProps {
  lessonPlanId: string;
  lessonTitle: string;
}

export function DeleteLessonPlanButton({
  lessonPlanId,
  lessonTitle,
}: DeleteLessonPlanButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `ต้องการลบแผนการสอน "${lessonTitle}" ใช่หรือไม่?`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/lesson-plans/${lessonPlanId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(result.error || "ไม่สามารถลบแผนการสอนได้");
        }

        toast.success("ลบแผนการสอนสำเร็จ");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบ"
        );
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
      {isPending ? "กำลังลบ..." : "ลบ"}
    </DropdownMenuItem>
  );
}
