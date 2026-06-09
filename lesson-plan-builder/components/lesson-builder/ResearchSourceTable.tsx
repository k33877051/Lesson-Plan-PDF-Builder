"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, Check, Globe, BookOpen, GraduationCap, FileText } from "lucide-react";

export interface ResearchSource {
  sourceId: string;
  title: string;
  url: string;
  platform: string;
  snippet: string;
  credibilityScore: number;
  relevanceScore: number;
  totalScore: number;
  qualityLabel: string;
  author?: string;
}

interface ResearchSourceTableProps {
  sources: ResearchSource[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onGenerateLesson: () => void;
  isGenerating?: boolean;
}

export function ResearchSourceTable({
  sources,
  selectedIds,
  onSelectionChange,
  onGenerateLesson,
  isGenerating = false,
}: ResearchSourceTableProps) {
  const [sortBy, setSortBy] = useState<"score" | "credibility" | "relevance">("score");

  const sortedSources = [...sources].sort((a, b) => {
    switch (sortBy) {
      case "credibility":
        return b.credibilityScore - a.credibilityScore;
      case "relevance":
        return b.relevanceScore - a.relevanceScore;
      case "score":
      default:
        return b.totalScore - a.totalScore;
    }
  });

  const toggleSource = (sourceId: string) => {
    if (selectedIds.includes(sourceId)) {
      onSelectionChange(selectedIds.filter((id) => id !== sourceId));
    } else {
      onSelectionChange([...selectedIds, sourceId]);
    }
  };

  const toggleAll = () => {
    if (selectedIds.length === sources.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sources.map((s) => s.sourceId));
    }
  };

  const getQualityBadge = (label: string) => {
    switch (label) {
      case "excellent":
        return <Badge className="bg-green-500">ดีเยี่ยม</Badge>;
      case "good":
        return <Badge className="bg-blue-500">ดี</Badge>;
      case "acceptable":
        return <Badge className="bg-yellow-500">พอใช้</Badge>;
      case "fair":
        return <Badge variant="outline">ปานกลาง</Badge>;
      default:
        return <Badge variant="secondary">พิจารณา</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 65) return "text-blue-600";
    if (score >= 50) return "text-yellow-600";
    return "text-gray-500";
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("youtube")) return <GraduationCap className="h-4 w-4" />;
    if (p.includes("gov") || p.includes("obec") || p.includes("ipst"))
      return <BookOpen className="h-4 w-4" />;
    if (p.includes("edu") || p.includes("ac.th") || p.includes("university"))
      return <GraduationCap className="h-4 w-4" />;
    if (p.includes("web") || p.includes("google")) return <Globe className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const selectedCount = selectedIds.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>แหล่งข้อมูลที่พบ ({sources.length})</CardTitle>
            <CardDescription>
              เลือกแหล่งข้อมูลที่ต้องการใช้สร้างแผนการสอน
              {selectedCount > 0 && (
                <span className="ml-2 text-blue-600">
                  (เลือก {selectedCount} รายการ)
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">เรียงตาม:</span>
            <div className="flex gap-1">
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("score")}
              >
                คะแนนรวม
              </Button>
              <Button
                variant={sortBy === "credibility" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("credibility")}
              >
                ความน่าเชื่อถือ
              </Button>
              <Button
                variant={sortBy === "relevance" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("relevance")}
              >
                ความเกี่ยวข้อง
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <Checkbox
            id="select-all"
            checked={selectedCount === sources.length && sources.length > 0}
            onCheckedChange={toggleAll}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            เลือกทั้งหมด
          </label>
          <div className="ml-auto">
            <Button
              onClick={onGenerateLesson}
              disabled={selectedCount === 0 || isGenerating}
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  สร้างแผนการสอน ({selectedCount})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sources Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>แหล่งข้อมูล</TableHead>
                <TableHead className="w-[100px]">คุณภาพ</TableHead>
                <TableHead className="w-[80px] text-center">คะแนน</TableHead>
                <TableHead className="w-[80px] text-center">น่าเชื่อ</TableHead>
                <TableHead className="w-[80px] text-center">เกี่ยวข้อง</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSources.map((source) => (
                <TableRow
                  key={source.sourceId}
                  className={selectedIds.includes(source.sourceId) ? "bg-blue-50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(source.sourceId)}
                      onCheckedChange={() => toggleSource(source.sourceId)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getPlatformIcon(source.platform)}
                        <span className="font-medium line-clamp-1">{source.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {source.snippet}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {source.platform}
                        </Badge>
                        {source.author && <span>โดย {source.author}</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getQualityBadge(source.qualityLabel)}</TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className={`font-bold ${getScoreColor(source.totalScore)}`}>
                            {source.totalScore}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>คะแนนรวม: {source.totalScore}/100</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {source.credibilityScore}
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {source.relevanceScore}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(source.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sources.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            ไม่พบแหล่งข้อมูล กรุณาลองค้นหาด้วยหัวข้อหรือคำสำคัญอื่น
          </div>
        )}
      </CardContent>
    </Card>
  );
}
