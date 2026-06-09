import { redirect } from "next/navigation";

export default async function DashboardLessonPlanPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/preview/${id}`);
}
