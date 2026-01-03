import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Plus, Trash2, MessageCircle } from "lucide-react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Chat() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Queries
  const conversationsQuery = trpc.conversation.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const messagesQuery = trpc.message.list.useQuery(
    { conversationId: selectedConversationId || 0 },
    { enabled: isAuthenticated && selectedConversationId !== null }
  );

  // Mutations
  const createConversationMutation = trpc.conversation.create.useMutation();
  const sendMessageMutation = trpc.message.send.useMutation();
  const deleteConversationMutation = trpc.conversation.delete.useMutation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Auto-select first conversation or create new one
  useEffect(() => {
    if (conversationsQuery.data && conversationsQuery.data.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedConversationId]);

  const handleCreateConversation = async () => {
    try {
      await createConversationMutation.mutateAsync({
        title: "新对话",
      });
      conversationsQuery.refetch();
    } catch (error) {
      toast.error("创建对话失败");
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedConversationId || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content: userMessage,
      });

      if (result.success) {
        messagesQuery.refetch();
      } else {
        toast.error(result.error || "发送失败");
      }
    } catch (error) {
      toast.error("发送消息失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    try {
      await deleteConversationMutation.mutateAsync({
        conversationId,
      });
      if (selectedConversationId === conversationId) {
        setSelectedConversationId(null);
      }
      conversationsQuery.refetch();
      toast.success("对话已删除");
    } catch (error) {
      toast.error("删除失败");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg gap-2"
            onClick={handleCreateConversation}
            disabled={createConversationMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            新建对话
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversationsQuery.isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          ) : conversationsQuery.data && conversationsQuery.data.length > 0 ? (
            <div className="p-2 space-y-2">
              {conversationsQuery.data.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between group ${
                    selectedConversationId === conv.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs opacity-70">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground text-sm">
              暂无对话记录
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-border">
          <div className="text-sm">
            <p className="font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messagesQuery.data && messagesQuery.data.length > 0 ? (
                messagesQuery.data.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <Card
                      className={`max-w-md lg:max-w-xl p-4 ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Streamdown>{msg.content}</Streamdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </Card>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>开始提问，获取政务办理指导</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-6 bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="输入您的问题..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                提示: 您可以提问如 "如何办理营业执照" 或 "注销营业执照需要什么材料"
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">选择或创建对话</p>
              <p className="text-muted-foreground">点击左侧"新建对话"开始咨询</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
