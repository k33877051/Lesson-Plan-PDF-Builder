"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Pagination uses built-in components
import {
  Loader2,
  AlertCircle,
  Database,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Globe,
  Box,
  Layers,
  Settings,
  FileCode,
  Type,
  Hash,
  Folder,
  Filter,
  Code,
} from "lucide-react";

interface RegistryObject {
  id: string;
  objectKey: string;
  objectName: string;
  objectType: string;
  module: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ObjectsResponse {
  success: boolean;
  data?: RegistryObject[];
  meta?: { pagination: PaginationData };
  error?: string;
}

interface StatsData {
  byType: Record<string, number>;
  byModule: Record<string, number>;
}

interface StatsResponse {
  success: boolean;
  data?: StatsData;
  error?: string;
}

const OBJECT_TYPE_ICONS: Record<string, React.ReactNode> = {
  api_route: <Globe className="h-4 w-4" />,
  prisma_model: <Database className="h-4 w-4" />,
  react_component: <Box className="h-4 w-4" />,
  service: <Layers className="h-4 w-4" />,
  feature: <Settings className="h-4 w-4" />,
  utility: <FileCode className="h-4 w-4" />,
  middleware: <Code className="h-4 w-4" />,
  type: <Type className="h-4 w-4" />,
  enum: <Hash className="h-4 w-4" />,
};

const OBJECT_TYPE_LABELS: Record<string, string> = {
  api_route: "API Route",
  prisma_model: "Prisma Model",
  react_component: "React Component",
  service: "Service",
  feature: "Feature",
  utility: "Utility",
  middleware: "Middleware",
  type: "Type",
  enum: "Enum",
};

export function ObjectRegistryPanel() {
  const [isLoading, setIsLoading] = useState(true);
  const [objects, setObjects] = useState<RegistryObject[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadObjects();
    loadStats();
  }, [currentPage, selectedType, selectedModule, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadObjects();
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadObjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", "20");
      if (searchQuery) params.set("search", searchQuery);
      if (selectedType) params.set("objectType", selectedType);
      if (selectedModule) params.set("module", selectedModule);
      if (selectedStatus) params.set("isActive", selectedStatus);

      const response = await fetch(`/api/system/objects?${params.toString()}`);
      const result: ObjectsResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || "ไม่สามารถโหลด Object Registry ได้");
      }

      setObjects(Array.isArray(result.data) ? result.data : []);
      setPagination(result.meta?.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลด");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/system/objects/sync");
      const result: StatsResponse = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleAutoSync = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/system/objects/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan" }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.meta?.message || "ซิงค์อัตโนมัติไม่สำเร็จ");
      }

      await loadObjects();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการซิงค์อัตโนมัติ");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    return OBJECT_TYPE_ICONS[type] || <Folder className="h-4 w-4" />;
  };

  const getTypeLabel = (type: string) => {
    return OBJECT_TYPE_LABELS[type] || type;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType(null);
    setSelectedModule(null);
    setSelectedStatus(null);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedType || selectedModule || selectedStatus;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.byType)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([type, count]) => (
              <Card key={type}>
                <CardContent className="flex items-center gap-3 py-4">
                  {getTypeIcon(type)}
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{getTypeLabel(type)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            ตัวกรอง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหา Key, Name, Description..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">ประเภท</label>
              <Select
                value={selectedType || "all"}
                onValueChange={(value) => setSelectedType(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  {stats && Object.keys(stats.byType).map(type => (
                    <SelectItem key={type} value={type}>
                      {getTypeLabel(type)} ({stats.byType[type]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">โมดูล</label>
              <Select
                value={selectedModule || "all"}
                onValueChange={(value) => setSelectedModule(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกโมดูล" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโมดูล</SelectItem>
                  {stats && Object.keys(stats.byModule).map(module => (
                    <SelectItem key={module} value={module}>
                      {module} ({stats.byModule[module]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) => setSelectedStatus(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
            >
              ล้างตัวกรอง
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadObjects}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Objects Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Objects
              {pagination && (
                <Badge variant="secondary">
                  {pagination.total} รายการ
                </Badge>
              )}
            </CardTitle>
            <Button variant="default" size="sm" onClick={handleAutoSync} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              ซิงค์อัตโนมัติ
            </Button>
          </div>
          <CardDescription>
            รายการ Object ที่ลงทะเบียนในระบบ (Phase 1-5: Read-only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">สถานะ</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>โมดูล</TableHead>
                  <TableHead className="hidden md:table-cell">อัปเดตล่าสุด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      <span className="text-sm text-muted-foreground mt-2">กำลังโหลด...</span>
                    </TableCell>
                  </TableRow>
                ) : objects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      ไม่พบ Objects
                    </TableCell>
                  </TableRow>
                ) : (
                  objects.map((obj) => (
                    <TableRow key={obj.id}>
                      <TableCell>
                        {obj.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                          {obj.objectKey}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{obj.objectName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(obj.objectType)}
                          <span className="text-sm">{getTypeLabel(obj.objectType)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{obj.module}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(obj.updatedAt).toLocaleDateString("th-TH")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                >
                  ก่อนหน้า
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      const diff = Math.abs(page - currentPage);
                      return page === 1 || page === pagination.totalPages || diff <= 2;
                    })
                    .map((page, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && page - prev > 1;
                      
                      return (
                        <div key={page} className="flex items-center">
                          {showEllipsis && (
                            <span className="px-2 text-muted-foreground">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        </div>
                      );
                    })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                >
                  ถัดไป
                </Button>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-2">
                หน้า {currentPage} จาก {pagination.totalPages} ({pagination.total} รายการ)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}