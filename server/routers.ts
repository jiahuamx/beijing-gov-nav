import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM, type Message } from "./_core/llm";
import { 
  createConversation, 
  getConversationsByUserId, 
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getMessagesByConversationId,
  getGovCategories,
  getGovProjectsByCategory,
  getGovProjectById,
  searchGovProjects,
  getFeeStandardsByProjectId,
  addUserFavorite,
  removeUserFavorite,
  getUserFavorites,
  isProjectFavorited,
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "./db";

const SYSTEM_PROMPT = `你是一个北京政务办理智能助手。你的职责是帮助用户了解北京市各类政务办理流程、所需材料、办理时间和费用等信息。

在回答用户问题时，请遵循以下原则：
1. 提供准确、清晰的政务办理流程指导
2. 列举所需的材料和证件
3. 说明办理时间和费用
4. 提供相关的注意事项和建议
5. 如果涉及具体的法律或政策问题，建议用户咨询官方部门或专业人士

请用友好、专业的语气与用户沟通。`;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ Conversation Routes ============
  conversation: router({
    create: protectedProcedure
      .input(z.object({ title: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const result = await createConversation(ctx.user.id, input.title);
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getConversationsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getConversationById(input.conversationId);
      }),

    updateTitle: protectedProcedure
      .input(z.object({ conversationId: z.number(), title: z.string() }))
      .mutation(async ({ input }) => {
        await updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteConversation(input.conversationId);
        return { success: true };
      }),
  }),

  // ============ Message Routes ============
  message: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await getMessagesByConversationId(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({ 
        conversationId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Save user message
        await addMessage(input.conversationId, "user", input.content);

        // Get conversation history for context
        const messageHistory = await getMessagesByConversationId(input.conversationId);
        
        // Prepare messages for LLM
        const llmMessages: Message[] = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messageHistory.map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          { role: "user", content: input.content },
        ];

        try {
          // Call LLM for response
          const response = await invokeLLM({
            messages: llmMessages,
          });

          const assistantContent = typeof response.choices[0]?.message?.content === "string" 
            ? response.choices[0].message.content 
            : "无法生成回复，请稍后重试。";
          
          // Save assistant response
          if (typeof assistantContent === "string") {
            await addMessage(input.conversationId, "assistant", assistantContent);
          }

          return {
            success: true,
            response: typeof assistantContent === "string" ? assistantContent : "无法生成回复",
          };
        } catch (error) {
          console.error("LLM Error:", error);
          return {
            success: false,
            error: "AI 服务暂时不可用，请稍后重试。",
          };
        }
      }),
  }),

  // ============ Government Project Routes ============
  govProject: router({
    categories: publicProcedure.query(async () => {
      return await getGovCategories();
    }),

    byCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await getGovProjectsByCategory(input.categoryId);
      }),

    detail: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await getGovProjectById(input.projectId);
        const fees = project ? await getFeeStandardsByProjectId(input.projectId) : [];
        return { project, fees };
      }),

    search: publicProcedure
      .input(z.object({ keyword: z.string() }))
      .query(async ({ input }) => {
        return await searchGovProjects(input.keyword);
      }),
  }),

  // ============ User Favorite Routes ============
  favorite: router({
    add: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await addUserFavorite(ctx.user.id, input.projectId);
        return { success: true };
      }),

    remove: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await removeUserFavorite(ctx.user.id, input.projectId);
        return { success: true };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const favorites = await getUserFavorites(ctx.user.id);
      const projects = await Promise.all(
        favorites.map(fav => getGovProjectById(fav.projectId))
      );
      return projects.filter(p => p !== null);
    }),

    isFavorited: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await isProjectFavorited(ctx.user.id, input.projectId);
      }),
  }),

  // ============ Notification Routes ============
  notification: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNotification(input.notificationId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
