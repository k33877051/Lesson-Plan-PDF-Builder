"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, BookOpen, Quote, CheckCircle2 } from "lucide-react";

export interface LinkedSource {
  sourceId: string;
  title: string;
  url: string;
  platform: string;
  credibilityScore: number;
  snippet?: string;
}

interface LessonPlanSourcesProps {
  sources: LinkedSource[];
  citations?: string[];
  onInsertCitation?: (citationNumber: number) => void;
}

export function LessonPlanSources({
  sources,
  citations,
  onInsertCitation,
}: LessonPlanSourcesProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 65) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("gov") || p.includes("obec") || p.includes("ipst"))
      return <BookOpen className="h-3 w-3" />;
    return <ExternalLink className="h-3 w-3" />;
  };

  return (
    <div className="space-y-4">
      {/* Sources List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            แหล่งข้อมูลอ้างอิง ({sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div
                  key={source.sourceId}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-muted group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs text-muted-foreground w-5">
                      [{index + 1}]
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate" title={source.title}>
                        {source.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] h-4 ${getScoreColor(
                            source.credibilityScore
                          )} text-white`}
                        >
                          {source.credibilityScore}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {source.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(source.url, "_blank")}
                        >
                          {getPlatformIcon(source.platform)}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>เปิดลิงก์</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {onInsertCitation && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onInsertCitation(index + 1)}
                          >
                            <Quote className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>แทรกการอ้างอิง [${index + 1}]</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Citations */}
      {citations && citations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              รายการอ้างอิง
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 text-xs text-muted-foreground">
                {citations.map((citation, index) => (
                  <div key={index} className="pl-4 border-l-2 border-muted">
                    <span className="font-medium text-foreground">[{index + 1}]</span>{" "}
                    {citation}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
