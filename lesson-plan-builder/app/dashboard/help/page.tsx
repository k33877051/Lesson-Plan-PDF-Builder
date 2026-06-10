import { Metadata } from "next";
import { HelpPageContent } from "@/components/dashboard/help-content";

export const metadata: Metadata = {
  title: "ช่วยเหลือ - Lesson Plan PDF Builder",
  description: "คู่มือการใช้งานระบบ Lesson Plan PDF Builder",
};

export default function HelpPage() {
  return <HelpPageContent />;
}
