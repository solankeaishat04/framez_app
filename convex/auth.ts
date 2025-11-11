// convex/auth.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists using the index
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first(); // Use first() instead of unique()

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create user with all required fields
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      password: args.password,
      avatar: undefined,
      bio: undefined,
      location: undefined,
      profession: undefined,
      expertise: [],
      createdAt: Date.now(),
    });

    // Return the complete user object
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

export const authenticateUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email using the index
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first(); // Use first() instead of unique()

    if (!user) {
      throw new Error("User not found");
    }

    // Simple password check (in production, use proper hashing!)
    if (user.password !== args.password) {
      throw new Error("Invalid password");
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

export const getCurrentUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Additional helper function to get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first(); // Use first() instead of unique()
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      profession: v.optional(v.string()),
      expertise: v.optional(v.array(v.string())),
      avatar: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, args.updates);
    return await ctx.db.get(args.userId);
  },
});