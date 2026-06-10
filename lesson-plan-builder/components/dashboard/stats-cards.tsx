import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface DashboardStatsProps {
  totalLessonPlans: number;
  completedLessonPlans: number;
  draftLessonPlans: number;
  exportedPdfCount: number;
}

export function DashboardStats({
  totalLessonPlans,
  completedLessonPlans,
  draftLessonPlans,
  exportedPdfCount,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "แผนการสอนทั้งหมด",
      value: totalLessonPlans.toLocaleString("th-TH"),
      description: "จำนวนแผนการสอนจากฐานข้อมูล",
      icon: FileText,
    },
    {
      title: "เสร็จสมบูรณ์",
      value: completedLessonPlans.toLocaleString("th-TH"),
      description: "แผนการสอนที่พร้อมใช้งาน",
      icon: CheckCircle,
    },
    {
      title: "ฉบับร่าง",
      value: draftLessonPlans.toLocaleString("th-TH"),
      description: "แผนการสอนที่กำลังแก้ไข",
      icon: Clock,
    },
    {
      title: "ไฟล์ PDF ที่ส่งออก",
      value: exportedPdfCount.toLocaleString("th-TH"),
      description: "นับจากไฟล์จริงในระบบ exports",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="rounded-md bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
