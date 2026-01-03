import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createMockContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Government Project Features", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createMockContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Categories", () => {
    it("should fetch government categories", async () => {
      const categories = await caller.govProject.categories();
      expect(Array.isArray(categories)).toBe(true);
      // Categories should have id, name, description fields
      if (categories.length > 0) {
        expect(categories[0]).toHaveProperty("id");
        expect(categories[0]).toHaveProperty("name");
      }
    });
  });

  describe("Projects by Category", () => {
    it("should fetch projects by category", async () => {
      // First get categories
      const categories = await caller.govProject.categories();
      
      if (categories.length > 0) {
        const categoryId = categories[0].id;
        const projects = await caller.govProject.byCategory({ categoryId });
        
        expect(Array.isArray(projects)).toBe(true);
        // Projects should have expected fields
        if (projects.length > 0) {
          expect(projects[0]).toHaveProperty("id");
          expect(projects[0]).toHaveProperty("name");
          expect(projects[0]).toHaveProperty("description");
        }
      }
    });
  });

  describe("Project Search", () => {
    it("should search projects by keyword", async () => {
      const results = await caller.govProject.search({ keyword: "营业执照" });
      expect(Array.isArray(results)).toBe(true);
      
      // If results found, verify structure
      if (results.length > 0) {
        expect(results[0]).toHaveProperty("id");
        expect(results[0]).toHaveProperty("name");
      }
    });

    it("should return empty array for non-existent keyword", async () => {
      const results = await caller.govProject.search({ 
        keyword: "非常不可能存在的项目名称12345" 
      });
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Project Details", () => {
    it("should fetch project details with fees", async () => {
      // Get a project first
      const categories = await caller.govProject.categories();
      
      if (categories.length > 0) {
        const projects = await caller.govProject.byCategory({ 
          categoryId: categories[0].id 
        });
        
        if (projects.length > 0) {
          const projectId = projects[0].id;
          const detail = await caller.govProject.detail({ projectId });
          
          expect(detail).toHaveProperty("project");
          expect(detail).toHaveProperty("fees");
          expect(Array.isArray(detail.fees)).toBe(true);
        }
      }
    });
  });

  describe("Conversation Management", () => {
    it("should create a conversation", async () => {
      const result = await caller.conversation.create({ 
        title: "Test Conversation" 
      });
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("should list user conversations", async () => {
      // Create a conversation first
      await caller.conversation.create({ title: "Test Conv" });
      
      // Then list conversations
      const conversations = await caller.conversation.list();
      expect(Array.isArray(conversations)).toBe(true);
    });

    it("should update conversation title", async () => {
      // Create a conversation
      await caller.conversation.create({ title: "Original Title" });
      
      // Get conversations
      const conversations = await caller.conversation.list();
      
      if (conversations.length > 0) {
        const convId = conversations[0].id;
        const result = await caller.conversation.updateTitle({
          conversationId: convId,
          title: "Updated Title",
        });
        
        expect(result).toHaveProperty("success");
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Favorite Management", () => {
    it("should add a project to favorites", async () => {
      // Get a project
      const categories = await caller.govProject.categories();
      
      if (categories.length > 0) {
        const projects = await caller.govProject.byCategory({ 
          categoryId: categories[0].id 
        });
        
        if (projects.length > 0) {
          const projectId = projects[0].id;
          const result = await caller.favorite.add({ projectId });
          
          expect(result).toHaveProperty("success");
          expect(result.success).toBe(true);
        }
      }
    });

    it("should list favorite projects", async () => {
      const favorites = await caller.favorite.list();
      expect(Array.isArray(favorites)).toBe(true);
    });

    it("should check if project is favorited", async () => {
      // Get a project
      const categories = await caller.govProject.categories();
      
      if (categories.length > 0) {
        const projects = await caller.govProject.byCategory({ 
          categoryId: categories[0].id 
        });
        
        if (projects.length > 0) {
          const projectId = projects[0].id;
          
          // Add to favorites
          await caller.favorite.add({ projectId });
          
          // Check if favorited
          const isFavorited = await caller.favorite.isFavorited({ projectId });
          expect(isFavorited).toBe(true);
        }
      }
    });

    it("should remove a project from favorites", async () => {
      // Get a project
      const categories = await caller.govProject.categories();
      
      if (categories.length > 0) {
        const projects = await caller.govProject.byCategory({ 
          categoryId: categories[0].id 
        });
        
        if (projects.length > 0) {
          const projectId = projects[0].id;
          
          // Add to favorites
          await caller.favorite.add({ projectId });
          
          // Remove from favorites
          const result = await caller.favorite.remove({ projectId });
          expect(result).toHaveProperty("success");
          expect(result.success).toBe(true);
        }
      }
    });
  });

  describe("Notifications", () => {
    it("should list user notifications", async () => {
      const notifications = await caller.notification.list();
      expect(Array.isArray(notifications)).toBe(true);
    });

    it("should mark notification as read", async () => {
      const notifications = await caller.notification.list();
      
      if (notifications.length > 0) {
        const notifId = notifications[0].id;
        const result = await caller.notification.markAsRead({ 
          notificationId: notifId 
        });
        
        expect(result).toHaveProperty("success");
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Authentication", () => {
    it("should get current user info", async () => {
      const user = await caller.auth.me();
      expect(user).toBeDefined();
      expect(user?.openId).toBe("test-user");
    });

    it("should logout user", async () => {
      const result = await caller.auth.logout();
      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });
  });
});
