import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, LogOut, Heart, MessageCircle, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();

  // Queries
  const conversationsQuery = trpc.conversation.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const favoritesQuery = trpc.favorite.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const notificationsQuery = trpc.notification.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      await logout();
      toast.success("已退出登录");
      navigate("/");
    } catch (error) {
      toast.error("退出登录失败");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">个人中心</h1>
          <p className="text-muted-foreground mb-6">请先登录以查看个人信息</p>
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => navigate("/")}
          >
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-2xl font-bold">个人中心</h1>
          <Button variant="outline" onClick={() => navigate("/")}>
            返回首页
          </Button>
        </div>
      </header>

      <div className="container py-8">
        {/* User Info Card */}
        <Card className="p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">{user.name || "用户"}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground mt-2">
                注册时间：{new Date(user.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-4">
                最后登录：{new Date(user.lastSignedIn).toLocaleDateString("zh-CN")}
              </p>
              <Button
                variant="destructive"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logoutMutation.isPending ? "退出中..." : "退出登录"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">咨询记录</p>
                <p className="text-3xl font-bold">
                  {conversationsQuery.data?.length || 0}
                </p>
              </div>
              <MessageCircle className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">收藏项目</p>
                <p className="text-3xl font-bold">
                  {favoritesQuery.data?.length || 0}
                </p>
              </div>
              <Heart className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">未读通知</p>
                <p className="text-3xl font-bold">
                  {notificationsQuery.data?.filter((n) => !n.read).length || 0}
                </p>
              </div>
              <Bell className="w-12 h-12 text-accent/20" />
            </div>
          </Card>
        </div>

        {/* Recent Conversations */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">最近咨询</h2>
          {conversationsQuery.isLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </Card>
          ) : conversationsQuery.data && conversationsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {conversationsQuery.data.slice(0, 5).map((conv) => (
                <Card
                  key={conv.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/chat")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{conv.title || "未命名对话"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(conv.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
              {conversationsQuery.data.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/chat")}
                >
                  查看全部咨询记录
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无咨询记录</p>
              <Button
                className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => navigate("/chat")}
              >
                开始咨询
              </Button>
            </Card>
          )}
        </div>

        {/* Favorite Projects */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">收藏项目</h2>
          {favoritesQuery.isLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </Card>
          ) : favoritesQuery.data && favoritesQuery.data.length > 0 ? (
            <div className="space-y-2">
              {favoritesQuery.data.slice(0, 5).map((project) => (
                <Card
                  key={project.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate("/projects")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </div>
                </Card>
              ))}
              {favoritesQuery.data.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/projects")}
                >
                  查看全部收藏
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无收藏项目</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/projects")}
              >
                浏览项目
              </Button>
            </Card>
          )}
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-2xl font-bold mb-4">通知中心</h2>
          {notificationsQuery.isLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </Card>
            ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {notificationsQuery.data.slice(0, 5).map((notif) => (
                <Card
                  key={notif.id}
                  className={`p-4 ${
                    notif.read ? "bg-background" : "bg-accent/5 border-accent/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notif.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notif.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    )}
                  </div>
                </Card>
              ))}
              {notificationsQuery.data.length > 5 && (
                <Button variant="outline" className="w-full">
                  查看全部通知
                </Button>
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无通知</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
