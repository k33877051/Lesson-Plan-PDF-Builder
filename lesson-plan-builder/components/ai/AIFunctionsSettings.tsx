"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  AlertCircle,
  Bot,
  Search,
  FileText,
  Settings,
  CheckCircle,
  XCircle,
  Server,
} from "lucide-react";

interface FunctionProvider {
  id: string;
  providerKey: string;
  providerName: string;
  providerType: string;
  model: string;
  priority: number;
  config: Record<string, unknown> | null;
  isEnabled: boolean;
  isDefaultProvider: boolean;
}

interface AIFunction {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  settings: Record<string, unknown> | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  providers: FunctionProvider[];
}

interface AIFunctionsData {
  functions: AIFunction[];
  count: number;
  categories: string[];
}

interface AIFunctionsResponse {
  success: boolean;
  data?: AIFunctionsData;
  error?: string;
}

export function AIFunctionsSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [functions, setFunctions] = useState<AIFunction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    loadFunctions();
  }, []);

  const loadFunctions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/ai/functions");
      const result: AIFunctionsResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "ไม่สามารถโหลดฟังก์ชัน AI ได้");
      }

      setFunctions(result.data.functions);
      setCategories(result.data.categories);
      
      // Expand all by default
      setExpandedItems(result.data.functions.map(f => f.key));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลด");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "content_generation":
        return <FileText className="h-5 w-5" />;
      case "research":
        return <Search className="h-5 w-5" />;
      case "analysis":
        return <Bot className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "content_generation":
        return "สร้างเนื้อหา";
      case "research":
        return "วิจัยและค้นหา";
      case "analysis":
        return "วิเคราะห์";
      default:
        return category;
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "content_generation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "research":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "analysis":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredFunctions = selectedCategory
    ? functions.filter(f => f.category === selectedCategory)
    : functions;

  const groupedFunctions = filteredFunctions.reduce((acc, func) => {
    const category = func.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(func);
    return acc;
  }, {} as Record<string, AIFunction[]>);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-3 py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>กำลังโหลดฟังก์ชัน AI...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            ฟังก์ชัน AI
          </CardTitle>
          <CardDescription>
            รายการฟังก์ชัน AI ที่ลงทะเบียนในระบบ พร้อมการตั้งค่า Provider
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategory === null ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(null)}
            >
              ทั้งหมด ({functions.length})
            </Badge>
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "secondary"}
                className={`cursor-pointer ${selectedCategory === category ? "" : getCategoryBadgeColor(category)}`}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              >
                {getCategoryLabel(category)} ({functions.filter(f => f.category === category).length})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Functions List */}
      {Object.entries(groupedFunctions).map(([category, categoryFunctions]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {getCategoryIcon(category)}
              {getCategoryLabel(category)}
              <Badge className={getCategoryBadgeColor(category)}>
                {categoryFunctions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion
              type="multiple"
              value={expandedItems}
              onValueChange={setExpandedItems}
              className="w-full"
            >
              {categoryFunctions.map((func) => (
                <AccordionItem key={func.key} value={func.key}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      {func.isEnabled ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-medium">{func.name}</span>
                      <code className="text-xs text-muted-foreground">{func.key}</code>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {/* Description */}
                    <p className="text-sm text-muted-foreground">
                      {func.description || "ไม่มีคำอธิบาย"}
                    </p>

                    {/* Settings Preview */}
                    {func.settings && Object.keys(func.settings).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">การตั้งค่าเริ่มต้น</h4>
                        <div className="bg-muted rounded-md p-3 text-xs font-mono">
                          <pre>{JSON.stringify(func.settings, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Providers */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        Providers ({func.providers.length})
                      </h4>
                      
                      {func.providers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          ยังไม่มี Provider ที่กำหนดสำหรับฟังก์ชันนี้
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {func.providers
                            .sort((a, b) => a.priority - b.priority)
                            .map((provider) => (
                              <div
                                key={provider.id}
                                className={`flex items-center justify-between p-3 rounded-md border ${
                                  provider.isEnabled
                                    ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                                    : "border-gray-200 bg-gray-50 dark:bg-gray-900/20"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-medium w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                      {provider.priority}
                                    </span>
                                    {provider.isDefaultProvider && (
                                      <Badge variant="default" className="text-xs">ค่าเริ่มต้น</Badge>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{provider.providerName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {provider.model}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={provider.isEnabled ? "default" : "secondary"}>
                                  {provider.isEnabled ? "พร้อมใช้งาน" : "ปิดใช้งาน"}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Last Updated */}
                    <p className="text-xs text-muted-foreground">
                      อัปเดตล่าสุด: {new Date(func.updatedAt).toLocaleString("th-TH")}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {filteredFunctions.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">ไม่พบฟังก์ชัน AI</h3>
            <p className="text-muted-foreground">
              {selectedCategory
                ? `ไม่มีฟังก์ชันในหมวดหมู่ ${getCategoryLabel(selectedCategory)}`
                : "ระบบยังไม่มีฟังก์ชัน AI ที่ลงทะเบียน"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}