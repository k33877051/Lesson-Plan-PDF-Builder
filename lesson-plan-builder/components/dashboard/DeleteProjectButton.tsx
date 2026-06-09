"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
  mode?: "dropdown" | "button";
}

export function DeleteProjectButton({
  projectId,
  projectName,
  mode = "dropdown",
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `ต้องการลบโปรเจกต์ "${projectName}" ใช่หรือไม่?\nไฟล์ PDF และข้อมูลที่เกี่ยวข้องจะถูกลบออกจากระบบ`
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          throw new Error(result.error || "ไม่สามารถลบโปรเจกต์ได้");
        }

        toast.success("ลบโปรเจกต์สำเร็จ");
        router.push("/dashboard/projects");
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบ"
        );
      }
    });
  };

  if (mode === "button") {
    return (
      <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        {isPending ? "กำลังลบ..." : "ลบ"}
      </Button>
    );
  }

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
