// convex/posts.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createPost = mutation({
  args: {
    content: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.string())),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    // Add userId to args since we're using custom auth
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    try {
      console.log("Creating post for user:", args.userId);

      // Verify the user exists
      const user = await ctx.db.get(args.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Use imageStorageIds if provided, otherwise fall back to imageUrls
      const storageIds = args.imageStorageIds || args.imageUrls || [];

      // Convert storageIds to URLs if images are provided
      let imageUrlsWithUrls: string[] = [];
      if (storageIds.length > 0) {
        imageUrlsWithUrls = await Promise.all(
          storageIds.map(async (storageId) => {
            const url = await ctx.storage.getUrl(storageId);
            return url || '';
          })
        );
        // Filter out any failed URLs
        imageUrlsWithUrls = imageUrlsWithUrls.filter(url => url !== '');
      }

      const postId = await ctx.db.insert("posts", {
        content: args.content || "",
        imageUrls: imageUrlsWithUrls,
        imageStorageIds: storageIds,
        authorId: args.userId, // Use the userId from args
        likes: 0,
        likesCount: 0,
        commentsCount: 0,
        createdAt: Date.now(),
        title: args.title || "",
        tags: args.tags || [],
      });

      console.log("Post created successfully with ID:", postId);
      return postId;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  },
});

// Keep all your other functions the same...
export const getAllPosts = query({
  args: {},
  handler: async (ctx) => {
    try {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_created", (q) => q.gt("createdAt", 0))
        .order("desc")
        .take(100);

      const postsWithAuthors = await Promise.all(
        posts.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          return {
            ...post,
            author: {
              _id: author?._id,
              name: author?.name || "Unknown User",
              avatar: author?.avatar,
              profession: author?.profession,
            },
          };
        })
      );

      return postsWithAuthors;
    } catch (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
  },
});

export const getPostsByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    try {
      if (!args.userId) return [];

      const posts = await ctx.db
        .query("posts")
        .withIndex("by_author", (q) => q.eq("authorId", args.userId!))
        .order("desc")
        .take(100);

      const author = await ctx.db.get(args.userId);

      const postsWithAuthor = posts.map((post) => ({
        ...post,
        author: {
          _id: author?._id,
          name: author?.name || "Unknown User",
          avatar: author?.avatar,
          profession: author?.profession,
        },
      }));

      return postsWithAuthor;
    } catch (error) {
      console.error("Error fetching user posts:", error);
      return [];
    }
  },
});

// Get a single post by ID
export const getPostById = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    try {
      const post = await ctx.db.get(args.postId);
      if (!post) {
        return null;
      }

      const author = await ctx.db.get(post.authorId);

      return {
        ...post,
        author: {
          _id: author?._id,
          name: author?.name || "Unknown User",
          avatar: author?.avatar,
          profession: author?.profession,
        },
      };
    } catch (error) {
      console.error("Error fetching post:", error);
      return null;
    }
  },
});

export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Check if post exists and user owns it
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== identity.subject) {
      throw new Error("You can only delete your own posts");
    }

    await ctx.db.delete(args.postId);
  },
});