import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Heart, MessageCircle, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Projects() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // Queries
  const categoriesQuery = trpc.govProject.categories.useQuery();
  const projectsQuery = trpc.govProject.byCategory.useQuery(
    { categoryId: selectedCategoryId || 0 },
    { enabled: selectedCategoryId !== null }
  );
  const searchQuery = trpc.govProject.search.useQuery(
    { keyword: searchKeyword },
    { enabled: searchKeyword.length > 0 }
  );
  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const addFavoriteMutation = trpc.favorite.add.useMutation();
  const removeFavoriteMutation = trpc.favorite.remove.useMutation();

  const projects = searchKeyword.length > 0 ? searchQuery.data : projectsQuery.data;
  const favoriteIds = new Set(favoritesQuery.data?.map((p) => p.id) || []);

  const handleToggleFavorite = async (projectId: number, isFavorited: boolean) => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }

    try {
      if (isFavorited) {
        await removeFavoriteMutation.mutateAsync({ projectId });
      } else {
        await addFavoriteMutation.mutateAsync({ projectId });
      }
      favoritesQuery.refetch();
    } catch (error) {
      toast.error("操作失败");
    }
  };

  const handleAskAboutProject = (projectName: string) => {
    if (!isAuthenticated) {
      toast.error("请先登录");
      return;
    }
    navigate("/chat");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">政务项目导航</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </header>

      <div className="container py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索政务项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-lg font-bold mb-4">项目分类</h2>
              <div className="space-y-2">
                <Button
                  variant={selectedCategoryId === null ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setSearchKeyword("");
                  }}
                >
                  全部项目
                </Button>
                {categoriesQuery.isLoading ? (
                  <div className="text-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  </div>
                ) : categoriesQuery.data ? (
                  categoriesQuery.data.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategoryId === cat.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setSearchKeyword("");
                      }}
                    >
                      {cat.name}
                    </Button>
                  ))
                ) : null}
              </div>
            </div>
          </div>

          {/* Main Content - Projects */}
          <div className="lg:col-span-3">
            {searchKeyword.length > 0 && searchQuery.isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">搜索中...</p>
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => {
                  const isFavorited = favoriteIds.has(project.id);
                  return (
                    <Card
                      key={project.id}
                      className="p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                          <p className="text-muted-foreground mb-4">
                            {project.description}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(project.id, isFavorited)}
                          className="ml-4 transition-colors"
                        >
                          <Heart
                            className={`w-6 h-6 ${
                              isFavorited
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground hover:text-red-500"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Project Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            办理时间
                          </p>
                          <p className="font-semibold">{project.timeRequired}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            基础费用
                          </p>
                          <p className="font-semibold">
                            {project.fees ? `¥${project.fees}` : "免费"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">
                            注意事项
                          </p>
                          <p className="font-semibold text-sm">{project.notes}</p>
                        </div>
                      </div>

                      {/* Materials */}
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          所需材料
                        </h4>
                        {project.materials ? (
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {(JSON.parse(project.materials as string) as string[]).map(
                              (material, idx) => (
                                <li key={idx}>{material}</li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无信息</p>
                        )}
                      </div>

                      {/* Steps */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">办理步骤</h4>
                        {project.steps ? (
                          <ol className="space-y-2 text-sm text-muted-foreground">
                            {(JSON.parse(project.steps as string) as string[]).map(
                              (step, idx) => (
                                <li key={idx} className="flex gap-3">
                                  <span className="font-semibold text-accent">
                                    {idx + 1}.
                                  </span>
                                  <span>{step}</span>
                                </li>
                              )
                            )}
                          </ol>
                        ) : (
                          <p className="text-sm text-muted-foreground">暂无信息</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                          onClick={() => handleAskAboutProject(project.name)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          AI 咨询
                        </Button>
                        {project.url && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.open(project.url || "", "_blank")}
                          >
                            官方网站
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {searchKeyword.length > 0
                    ? "没有找到相关项目"
                    : "选择分类查看政务项目"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
