// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// MAKE SURE THIS IS EXPORTED
export const updateUser = mutation({
  args: {
    
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      profession: v.optional(v.string()),
      avatar: v.optional(v.string()),
    })
  },
  handler: async (ctx, { userId, updates }) => {
    await ctx.db.patch(userId, updates);
    return await ctx.db.get(userId);
  },
});

export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .collect();

    const followers = await ctx.db
      .query("followers")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();

    const following = await ctx.db
      .query("followers")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    return {
      postsCount: posts.length,
      followersCount: followers.length,
      followingCount: following.length,
    };
  },
});