// convex/users.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

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

export const followUser = mutation({
  args: { 
    userId: v.id("users"), 
    targetUserId: v.id("users") 
  },
  handler: async (ctx, args) => {
    // Check if user is trying to follow themselves
    if (args.userId === args.targetUserId) {
      throw new Error("Cannot follow yourself");
    }

    const user = await ctx.db.get(args.userId);
    const targetUser = await ctx.db.get(args.targetUserId);
    
    if (!user) throw new Error("User not found");
    if (!targetUser) throw new Error("Target user not found");

    // Check if already following using the relationship index
    const existingFollow = await ctx.db
      .query("followers")
      .withIndex("by_relationship", (q) => 
        q.eq("followerId", args.userId).eq("followingId", args.targetUserId)
      )
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    const followId = await ctx.db.insert("followers", {
      followerId: args.userId,
      followingId: args.targetUserId,
      createdAt: Date.now(),
    });

    // Update user's following count
    const updatedFollowing = [...(user.following || []), args.targetUserId];
    await ctx.db.patch(args.userId, {
      following: updatedFollowing
    });

    // Update target user's followers count
    const updatedFollowers = [...(targetUser.followers || []), args.userId];
    await ctx.db.patch(args.targetUserId, {
      followers: updatedFollowers
    });

    return { success: true, followId };
  },
});

export const unfollowUser = mutation({
  args: { 
    userId: v.id("users"), 
    targetUserId: v.id("users") 
  },
  handler: async (ctx, args) => {
    // Check if user is trying to unfollow themselves
    if (args.userId === args.targetUserId) {
      throw new Error("Cannot unfollow yourself");
    }

    const user = await ctx.db.get(args.userId);
    const targetUser = await ctx.db.get(args.targetUserId);
    
    if (!user) throw new Error("User not found");
    if (!targetUser) throw new Error("Target user not found");

    // Find the follow relationship using the relationship index
    const existingFollow = await ctx.db
      .query("followers")
      .withIndex("by_relationship", (q) => 
        q.eq("followerId", args.userId).eq("followingId", args.targetUserId)
      )
      .first();

    if (!existingFollow) {
      throw new Error("Not following this user");
    }

    // Delete follow relationship
    await ctx.db.delete(existingFollow._id);

    // Update user's following count
    const updatedFollowing = (user.following || []).filter(id => id !== args.targetUserId);
    await ctx.db.patch(args.userId, {
      following: updatedFollowing
    });

    // Update target user's followers count
    const updatedFollowers = (targetUser.followers || []).filter(id => id !== args.userId);
    await ctx.db.patch(args.targetUserId, {
      followers: updatedFollowers
    });

    return { success: true };
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const followers = await ctx.db
      .query("followers")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();

    const followerDetails = await Promise.all(
      followers.map(async (follow) => {
        const user = await ctx.db.get(follow.followerId);
        return user;
      })
    );

    return followerDetails.filter(Boolean);
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const following = await ctx.db
      .query("followers")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    const followingDetails = await Promise.all(
      following.map(async (follow) => {
        const user = await ctx.db.get(follow.followingId);
        return user;
      })
    );

    return followingDetails.filter(Boolean);
  },
});

export const isFollowing = query({
  args: { 
    followerId: v.id("users"), 
    followingId: v.id("users") 
  },
  handler: async (ctx, { followerId, followingId }) => {
    if (followerId === followingId) {
      return false; // Users cannot follow themselves
    }

    const follow = await ctx.db
      .query("followers")
      .withIndex("by_relationship", (q) => 
        q.eq("followerId", followerId).eq("followingId", followingId)
      )
      .first();

    return !!follow;
  },
});