import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, DollarSign, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function Fees() {
  const [, navigate] = useLocation();
  const [searchKeyword, setSearchKeyword] = useState("");

  // Queries - 获取所有项目及其费用信息
  const projectsQuery = trpc.govProject.byCategory.useQuery(
    { categoryId: 0 },
    { enabled: true }
  );
  const searchQuery = trpc.govProject.search.useQuery(
    { keyword: searchKeyword },
    { enabled: searchKeyword.length > 0 }
  );

  // 从项目中提取费用信息
  const extractFees = (projects: any[]) => {
    return projects.map((project) => ({
      id: project.id,
      serviceName: project.name,
      fee: project.fees || 0,
      basis: "北京市政府规定",
      paymentMethod: "现场或在线支付",
      remarks: project.notes || "",
    }));
  };

  const allProjects = searchKeyword.length > 0 ? searchQuery.data : projectsQuery.data;
  const fees = extractFees(allProjects || []);

  const totalFees = fees?.reduce((sum: number, fee: any) => sum + (fee.fee || 0), 0) || 0;
  const averageFee = fees && fees.length > 0 ? totalFees / fees.length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">收费标准公示</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </header>

      <div className="container py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">项目总数</p>
                <p className="text-3xl font-bold">{fees?.length || 0}</p>
              </div>
              <FileText className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">平均费用</p>
                <p className="text-3xl font-bold">¥{averageFee.toFixed(0)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">总费用</p>
                <p className="text-3xl font-bold">¥{totalFees.toFixed(0)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索收费项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Fees Table */}
        <Card className="overflow-hidden">
          {projectsQuery.isLoading || searchQuery.isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : fees && fees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">服务项目</th>
                    <th className="px-6 py-4 text-left font-semibold">收费标准</th>
                    <th className="px-6 py-4 text-left font-semibold">收费依据</th>
                    <th className="px-6 py-4 text-left font-semibold">缴费方式</th>
                    <th className="px-6 py-4 text-left font-semibold">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee: any, idx: number) => (
                    <tr
                      key={fee.id}
                      className={`border-b border-border hover:bg-muted/50 transition-colors ${
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">{fee.serviceName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-accent/10 text-accent">
                          {fee.fee ? `¥${fee.fee}` : "免费"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {fee.basis}
                      </td>
                      <td className="px-6 py-4 text-sm">{fee.paymentMethod}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {fee.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchKeyword.length > 0 ? "没有找到相关收费项目" : "暂无收费数据"}
              </p>
            </div>
          )}
        </Card>

        {/* Fee Policy */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold mb-4">收费政策说明</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">1. 收费标准：</span>
              本公示的收费标准是根据北京市相关部门的规定制定的，具体收费金额可能因不同情况而有所调整。
            </p>
            <p>
              <span className="font-semibold text-foreground">2. 收费依据：</span>
              所有收费项目都有明确的法律或政策依据，市民可向相关部门咨询具体的收费规定。
            </p>
            <p>
              <span className="font-semibold text-foreground">3. 缴费方式：</span>
              市民可通过现场支付、银行转账、在线支付等多种方式缴纳费用，具体方式请咨询办理机构。
            </p>
            <p>
              <span className="font-semibold text-foreground">4. 优惠政策：</span>
              符合条件的市民（如下岗人员、残疾人等）可享受相关费用减免或优惠政策，详情请咨询办理机构。
            </p>
            <p>
              <span className="font-semibold text-foreground">5. 投诉渠道：</span>
              如对收费有异议，可向相关部门投诉，投诉电话：12345（北京市政务服务热线）。
            </p>
          </div>
        </Card>

        {/* Contact Info */}
        <Card className="mt-8 p-6 bg-accent/5 border-accent/20">
          <h2 className="text-xl font-bold mb-4">咨询与投诉</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">政务服务热线</h3>
              <p className="text-lg font-bold text-accent">12345</p>
              <p className="text-sm text-muted-foreground">
                工作时间：周一至周五 9:00-17:00
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">在线咨询</h3>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => window.open("https://banshi.beijing.gov.cn/", "_blank")}
              >
                访问北京市政务服务门户
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
