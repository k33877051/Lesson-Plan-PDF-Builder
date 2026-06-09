"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Link2, Link2Off, BookOpen, Globe, Play, FileText } from "lucide-react";

interface SourceCardProps {
  id: string;
  title: string;
  url: string;
  platform: string;
  snippet: string | null;
  credibilityScore: number;
  relevanceScore: number;
  totalScore: number;
  isLinked?: boolean;
  onLink?: (sourceId: string) => void;
  onUnlink?: (sourceId: string) => void;
  onExtract?: (sourceId: string) => void;
  isExtracting?: boolean;
}

export function SourceCard({
  id,
  title,
  url,
  platform,
  snippet,
  credibilityScore,
  relevanceScore,
  totalScore,
  isLinked = false,
  onLink,
  onUnlink,
  onExtract,
  isExtracting = false,
}: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case "youtube":
        return <Play className="h-4 w-4" />;
      case "google":
      case "web":
        return <Globe className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 70) return "default";
    if (score >= 50) return "secondary";
    return "outline";
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {getPlatformIcon()}
            <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge
              variant={getScoreBadgeVariant(totalScore)}
              className={`text-xs ${getScoreColor(totalScore)} text-white`}
            >
              {totalScore}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {snippet || "ไม่มีคำอธิบาย"}
        </p>

        {/* Score indicators */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>ความน่าเชื่อถือ:</span>
            <span
              className={`font-medium ${
                credibilityScore >= 70
                  ? "text-green-600"
                  : credibilityScore >= 50
                  ? "text-yellow-600"
                  : "text-orange-600"
              }`}
            >
              {credibilityScore}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span>ความเกี่ยวข้อง:</span>
            <span
              className={`font-medium ${
                relevanceScore >= 70
                  ? "text-green-600"
                  : relevanceScore >= 50
                  ? "text-yellow-600"
                  : "text-orange-600"
              }`}
            >
              {relevanceScore}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={() => window.open(url, "_blank")}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            เปิด
          </Button>

          {onExtract && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onExtract(id)}
              disabled={isExtracting}
            >
              <BookOpen className="h-3 w-3 mr-1" />
              {isExtracting ? "กำลังดึงข้อมูล..." : "ดึงข้อมูล"}
            </Button>
          )}

          {isLinked ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onUnlink?.(id)}
            >
              <Link2Off className="h-3 w-3 mr-1" />
              ยกเลิก
            </Button>
          ) : (
            <Button
              variant={isLinked ? "secondary" : "default"}
              size="sm"
              className="flex-1 h-8"
              onClick={() => onLink?.(id)}
            >
              <Link2 className="h-3 w-3 mr-1" />
              เชื่อมโยง
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
