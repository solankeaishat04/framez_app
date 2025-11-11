// convex/search.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Search across users, posts, and projects
export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const searchTerm = args.query.toLowerCase().trim();
    
    if (!searchTerm) {
      return [];
    }

    try {
      // Search users
      const users = await ctx.db
        .query("users")
        .withSearchIndex("search_name", (q) => 
          q.search("name", searchTerm)
        )
        .take(10);

      // Search posts
      const posts = await ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => 
          q.search("title", searchTerm)
        )
        .take(10);

      // Format user results
      const userResults = users.map(user => ({
        _id: user._id,
        _creationTime: user._creationTime,
        name: user.name || "Unknown User",
        type: "user" as const,
        imageUrl: user.imageUrls,
        expertise: user.expertise,
        bio: user.bio,
      }));

      // Format post results
      const postResults = posts.map(post => ({
        _id: post._id,
        _creationTime: post._creationTime,
        name: post.title || "Untitled Post",
        type: "post" as const,
        imageUrl: post.imageUrls,
        title: post.title,
      }));

      // Combine and return results
      return [...userResults, ...postResults];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },
});

// Get search history
export const getSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    // In a real app, you'd want to associate this with the current user
    // For now, return a global search history
    const history = await ctx.db
      .query("searchHistory")
      .order("desc")
      .take(10);
    
    return history;
  },
});

// Add to search history
export const addToSearchHistory = mutation({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchHistory")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();

    if (existing) {
      // Update timestamp if exists
      await ctx.db.patch(existing._id, {
        timestamp: Date.now(),
      });
    } else {
      // Add new search history item
      await ctx.db.insert("searchHistory", {
        query: args.query,
        timestamp: Date.now(),
      });
    }
  },
});

// Remove from search history
export const removeFromSearchHistory = mutation({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchHistory")
      .withIndex("by_query", (q) => q.eq("query", args.query))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});