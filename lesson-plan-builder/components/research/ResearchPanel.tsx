"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { SourceList } from "./SourceList";
import { toast } from "sonner";

interface ResearchQuery {
  id: string;
  query: string;
  platform: string;
  status: string;
  resultsCount: number | null;
  createdAt: string;
}

interface ResearchSource {
  id: string;
  title: string;
  url: string;
  platform: string;
  snippet: string | null;
  fullText: string | null;
  author: string | null;
  publishedAt: string | null;
  credibilityScore: number;
  relevanceScore: number;
  totalScore: number;
  language: string;
  chunkCount: number;
  isLinked: boolean;
}

interface ResearchJob {
  id: string;
  topic: string;
  subject: string;
  gradeLevel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  queries: ResearchQuery[];
  sources: ResearchSource[];
}

interface ResearchPanelProps {
  lessonPlanId: string;
  subject: string;
  gradeLevel: string;
  topic: string;
  onUseResearch?: (jobId: string, sources: ResearchSource[]) => void;
}

export function ResearchPanel({
  lessonPlanId,
  subject,
  gradeLevel,
  topic,
  onUseResearch,
}: ResearchPanelProps) {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [sources, setSources] = useState<ResearchSource[]>([]);

  // Start research
  const startResearch = async () => {
    if (!subject || !gradeLevel || !topic) {
      toast.error("กรุณาระบุวิชา ระดับชั้น และหัวข้อก่อนเริ่มการค้นคว้า");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          gradeLevel,
          lessonPlanId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to start research");
      }

      toast.success("เริ่มการค้นคว้าอัตโนมัติแล้ว");

      // Poll for status
      if (data.jobId) {
        pollJobStatus(data.jobId);
      }
    } catch (error) {
      console.error("Start research error:", error);
      toast.error("ไม่สามารถเริ่มการค้นคว้าได้");
    } finally {
      setLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    setPolling(true);

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/research/status?jobId=${jobId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          console.error("Failed to get job status:", data.error);
          return;
        }

        setJob(data.job);
        setSources(data.job.sources || []);

        // Continue polling if job is still running
        if (data.job.status === "RUNNING" || data.job.status === "PENDING") {
          setTimeout(checkStatus, 3000);
        } else if (data.job.status === "COMPLETED") {
          setPolling(false);
          toast.success("การค้นคว้าเสร็จสิ้น");
          onUseResearch?.(jobId, data.job.sources || []);
        } else if (data.job.status === "FAILED") {
          setPolling(false);
          toast.error("การค้นคว้าล้มเหลว");
        }
      } catch (error) {
        console.error("Poll status error:", error);
        setPolling(false);
      }
    };

    checkStatus();
  };

  // Link source to lesson plan
  const linkSource = async (sourceId: string) => {
    try {
      const response = await fetch("/api/research/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          lessonPlanId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to link source");
      }

      // Update local state
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, isLinked: true } : s))
      );

      toast.success("เชื่อมโยงแหล่งข้อมูลแล้ว");
    } catch (error) {
      console.error("Link source error:", error);
      toast.error("ไม่สามารถเชื่อมโยงแหล่งข้อมูลได้");
    }
  };

  // Unlink source
  const unlinkSource = async (sourceId: string) => {
    try {
      const response = await fetch(
        `/api/research/sources?sourceId=${sourceId}&lessonPlanId=${lessonPlanId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to unlink source");
      }

      // Update local state
      setSources((prev) =>
        prev.map((s) => (s.id === sourceId ? { ...s, isLinked: false } : s))
      );

      toast.success("ยกเลิกการเชื่อมโยงแล้ว");
    } catch (error) {
      console.error("Unlink source error:", error);
      toast.error("ไม่สามารถยกเลิกการเชื่อมโยงได้");
    }
  };

  // Extract content from source
  const extractSource = async (sourceId: string) => {
    try {
      const response = await fetch("/api/research/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to extract content");
      }

      toast.success("ดึงข้อมูลสำเร็จ");

      // Refresh job to get updated source data
      if (job?.id) {
        pollJobStatus(job.id);
      }
    } catch (error) {
      console.error("Extract error:", error);
      toast.error("ไม่สามารถดึงข้อมูลได้");
    }
  };

  // Refresh sources
  const refreshSources = async () => {
    if (!job?.id) return;
    pollJobStatus(job.id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "RUNNING":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="default">เสร็จสิ้น</Badge>;
      case "FAILED":
        return <Badge variant="destructive">ล้มเหลว</Badge>;
      case "RUNNING":
        return <Badge variant="secondary">กำลังดำเนินการ...</Badge>;
      case "PENDING":
        return <Badge variant="outline">รอดำเนินการ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>AI ค้นคว้าอัตโนมัติ</CardTitle>
          </div>
          {job && getStatusBadge(job.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Parameters */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">วิชา</Label>
            <Input value={subject} disabled className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ระดับชั้น</Label>
            <Input value={gradeLevel} disabled className="h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">หัวข้อ</Label>
            <Input value={topic} disabled className="h-8" />
          </div>
        </div>

        {/* Start Research Button */}
        {!job && (
          <Button
            onClick={startResearch}
            disabled={loading || polling || !subject || !gradeLevel || !topic}
            className="w-full"
          >
            {loading || polling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังค้นคว้า...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                ค้นหาข้อมูลอัตโนมัติ
              </>
            )}
          </Button>
        )}

        {/* Job Progress */}
        {job && (
          <Accordion type="single" collapsible defaultValue="progress">
            <AccordionItem value="progress" className="border-0">
              <AccordionTrigger className="py-2 hover:no-underline">
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(job.status)}
                  <span>ความคืบหน้า ({job.queries.length} คำค้นหา)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 mt-2">
                  {job.queries.map((query, index) => (
                    <div
                      key={query.id}
                      className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{index + 1}.</span>
                        <span className="truncate max-w-[200px]">{query.query}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {query.platform}
                        </Badge>
                        {query.status === "COMPLETED" && (
                          <span className="text-green-600">
                            {query.resultsCount} ผลลัพธ์
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Separator />

        {/* Sources */}
        {sources.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">แหล่งข้อมูลที่พบ</h3>
              <Badge variant="outline">{sources.length} รายการ</Badge>
            </div>
            <SourceList
              sources={sources}
              onLink={linkSource}
              onUnlink={unlinkSource}
              onExtract={extractSource}
              onRefresh={refreshSources}
              isLoading={polling}
              lessonPlanId={lessonPlanId}
            />
          </div>
        )}

        {job?.status === "COMPLETED" && sources.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            ไม่พบแหล่งข้อมูลที่เกี่ยวข้อง ลองค้นหาใหม่
          </div>
        )}
      </CardContent>
    </Card>
  );
}
