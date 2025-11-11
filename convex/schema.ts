// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    imageUrls: v.optional(v.array(v.string())), // Store image URLs
    imageStorageIds: v.optional(v.array(v.string())), // Store Convex storage IDs
    password: v.string(),
    avatar: v.optional(v.string()),
    createdAt: v.number(),
    expertise: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    profession: v.optional(v.string()),
  })
  .index("by_email", ["email"])
  .searchIndex("search_name", { 
    searchField: "name" 
  })
  .searchIndex("search_expertise", {
    searchField: "expertise"
  }),

  // UPDATED: Posts table with multiple images support and storage IDs
  posts: defineTable({
    content: v.optional(v.string()), // Make content optional for image-only posts
    imageUrls: v.optional(v.array(v.string())), // Changed to array for multiple images
    imageStorageIds: v.optional(v.array(v.string())), // ADDED: Storage IDs for Convex file storage
    authorId: v.id("users"),
    likes: v.number(),
    likesCount: v.number(), // Added for better counting
    commentsCount: v.number(),
    createdAt: v.number(),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  })
  .index("by_author", ["authorId"])
  .index("by_created", ["createdAt"])
  .searchIndex("search_content", {
    searchField: "content"
  })
  .searchIndex("search_title", {
    searchField: "title"
  }),

  projects: defineTable({
    title: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    userId: v.id("users"),
    tags: v.array(v.string()),
    category: v.string(),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_category", ["category"])
  .searchIndex("search_title", {
    searchField: "title"
  })
  .searchIndex("search_description", {
    searchField: "description"
  }),

  searchHistory: defineTable({
    userId: v.string(),
    query: v.string(),
    timestamp: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_query", ["userId", "query"])
  .index("by_timestamp", ["timestamp"]),

  followers: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
    createdAt: v.number(),
  })
  .index("by_follower", ["followerId"])
  .index("by_following", ["followingId"])
  .index("by_relationship", ["followerId", "followingId"]),

  // ADDED: Comments table
  comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
    createdAt: v.number(),
  })
  .index("by_post", ["postId"])
  .index("by_author", ["authorId"]),

  // ADDED: Likes table for tracking individual likes
  likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
  .index("by_post", ["postId"])
  .index("by_user", ["userId"])
  .index("by_post_user", ["postId", "userId"]),
});