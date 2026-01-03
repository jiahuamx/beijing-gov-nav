import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { MessageCircle, FileText, Users, DollarSign, Zap, Bell } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const features = [
    {
      icon: MessageCircle,
      title: "智能问答",
      description: "通过自然语言提问，获取详细的政务办理流程和所需材料",
      color: "from-blue-400 to-blue-600",
    },
    {
      icon: FileText,
      title: "办事指南",
      description: "按分类浏览各类政务事项，工商、税务、社保等一应俱全",
      color: "from-purple-400 to-purple-600",
    },
    {
      icon: DollarSign,
      title: "收费公示",
      description: "透明公开的收费标准和缴费方式，让办事更加放心",
      color: "from-amber-400 to-amber-600",
    },
    {
      icon: Users,
      title: "个人中心",
      description: "保存咨询记录，收藏常用办事项目，方便快速查询",
      color: "from-green-400 to-green-600",
    },
    {
      icon: Zap,
      title: "语音提问",
      description: "支持语音输入，系统自动转换为文字进行AI问答",
      color: "from-pink-400 to-pink-600",
    },
    {
      icon: Bell,
      title: "政策通知",
      description: "政策更新和流程变化时，及时接收通知提醒",
      color: "from-cyan-400 to-cyan-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center">
              <span className="text-white font-bold text-sm">北</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">北京政务导航</h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium hover:text-accent transition-colors">功能介绍</a>
            <a href="/projects" className="text-sm font-medium hover:text-accent transition-colors">政务项目</a>
            <a href="/fees" className="text-sm font-medium hover:text-accent transition-colors">收费标准</a>
            <a href="#about" className="text-sm font-medium hover:text-accent transition-colors">关于我们</a>
          </nav>
        </div>
        <div>
          {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/dashboard")}
                >
                  进入系统
                </Button>
               </div>
            ) : (
              <Button
                size="sm"
                onClick={() => window.location.href = getLoginUrl()}
              >
                登录
              </Button>
            )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-6 inline-block">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20">🚀 智能政务助手</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">北京政务办理</span>
              <br />
              一站式智能导航
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              无论是办理营业执照、注销企业、缴纳社保，还是处理税务问题，
              我们的 AI 助手都能为您提供详细的流程指导和所需材料清单。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg"
              onClick={() => navigate("/chat")}
            >
              开始咨询
            </Button>
              ) : (
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg"
                onClick={() => window.location.href = getLoginUrl()}
              >
                立即开始
              </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/projects")}
              >
                浏览项目
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">核心功能</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              集智能问答、办事指南、收费公示等功能于一体，
              为北京市民和企业提供全面的政务办理支持
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-card text-card-foreground rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow p-6 hover:shadow-lg">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-accent/10 to-accent/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">准备好了吗？</h2>
            <p className="text-lg text-muted-foreground mb-8">
              登录后即可开始使用我们的智能政务导航系统，
              获取专业的办事指导和流程支持。
            </p>
            {isAuthenticated ? (
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg"
              onClick={() => navigate("/chat")}
            >
              进入AI问答
            </Button>
            ) : (
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg"
                onClick={() => window.location.href = getLoginUrl()}
              >
                立即登录
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">关于我们</h4>
              <p className="text-sm text-muted-foreground">
                北京智能政务导航系统致力于为市民和企业提供便捷、专业的政务办理支持。
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">快速链接</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-accent">首页</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-accent">功能介绍</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-accent">帮助中心</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">政务服务</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-accent">工商注册</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-accent">税务办理</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-accent">社保公积金</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">联系我们</h4>
              <p className="text-sm text-muted-foreground">
                邮箱: support@beijing-gov-nav.cn<br />
                电话: 400-800-8888
              </p>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 北京智能政务导航系统. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
