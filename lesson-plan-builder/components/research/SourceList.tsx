"use client";

import { useState } from "react";
import { SourceCard } from "./SourceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, RefreshCw } from "lucide-react";

interface Source {
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

interface SourceListProps {
  sources: Source[];
  onLink: (sourceId: string) => void;
  onUnlink: (sourceId: string) => void;
  onExtract: (sourceId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  lessonPlanId: string;
}

export function SourceList({
  sources,
  onLink,
  onUnlink,
  onExtract,
  onRefresh,
  isLoading = false,
  lessonPlanId,
}: SourceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [extractingId, setExtractingId] = useState<string | null>(null);

  // Filter sources
  const filteredSources = sources.filter((source) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      source.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (source.snippet?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    // Score filter
    const matchesScore =
      scoreFilter === "all" ||
      (scoreFilter === "high" && source.totalScore >= 70) ||
      (scoreFilter === "medium" && source.totalScore >= 50 && source.totalScore < 70) ||
      (scoreFilter === "low" && source.totalScore < 50);

    // Platform filter
    const matchesPlatform =
      platformFilter === "all" || source.platform.toLowerCase() === platformFilter.toLowerCase();

    return matchesSearch && matchesScore && matchesPlatform;
  });

  // Get unique platforms
  const platforms = [...new Set(sources.map((s) => s.platform))];

  const handleExtract = async (sourceId: string) => {
    setExtractingId(sourceId);
    try {
      await onExtract(sourceId);
    } finally {
      setExtractingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาแหล่งข้อมูล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-1" />
              <SelectValue placeholder="คะแนน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="high">คะแนนสูง (70+)</SelectItem>
              <SelectItem value="medium">ปานกลาง (50-69)</SelectItem>
              <SelectItem value="low">ต่ำ (&lt;50)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="แพลตฟอร์ม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>พบ {filteredSources.length} แหล่งข้อมูล</span>
        <Badge variant="outline">
          {sources.filter((s) => s.isLinked).length} เชื่อมโยงแล้ว
        </Badge>
        <Badge variant="outline">
          {sources.filter((s) => s.fullText).length} ดึงข้อมูลแล้ว
        </Badge>
      </div>

      {/* Source Grid */}
      {filteredSources.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm || scoreFilter !== "all" || platformFilter !== "all"
            ? "ไม่พบแหล่งข้อมูลที่ตรงกับเงื่อนไข"
            : "ยังไม่มีแหล่งข้อมูล กรุณาค้นหาใหม่"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              id={source.id}
              title={source.title}
              url={source.url}
              platform={source.platform}
              snippet={source.snippet}
              credibilityScore={source.credibilityScore}
              relevanceScore={source.relevanceScore}
              totalScore={source.totalScore}
              isLinked={source.isLinked}
              onLink={onLink}
              onUnlink={onUnlink}
              onExtract={source.fullText ? undefined : handleExtract}
              isExtracting={extractingId === source.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
