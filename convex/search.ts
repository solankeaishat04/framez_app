// convex/search.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, { query: searchTerm }) => {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) return [];

    try {
      // Search users by name and expertise
      const users = await ctx.db
        .query("users")
        .withSearchIndex("search_name", (q) => 
          q.search("name", term)
        )
        .take(10);

      const usersByExpertise = await ctx.db
        .query("users")
        .withSearchIndex("search_expertise", (q) => 
          q.search("expertise", term)
        )
        .take(10);

      // Combine and deduplicate users
      const allUsers = [...users, ...usersByExpertise];
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u._id === user._id)
      );

      // Get user details with post and follower counts
      const usersWithDetails = await Promise.all(
        uniqueUsers.map(async (user) => {
          const postsCount = await ctx.db
            .query("posts")
            .withIndex("by_author", (q) => q.eq("authorId", user._id))
            .collect()
            .then(posts => posts.length);

          const followersCount = await ctx.db
            .query("followers")
            .withIndex("by_following", (q) => q.eq("followingId", user._id))
            .collect()
            .then(followers => followers.length);

          return {
            ...user,
            postsCount,
            followersCount
          };
        })
      );

      // Search posts by content and title
      const postsByContent = await ctx.db
        .query("posts")
        .withSearchIndex("search_content", (q) => 
          q.search("content", term)
        )
        .take(10);

      const postsByTitle = await ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => 
          q.search("title", term)
        )
        .take(10);

      // Combine and deduplicate posts
      const allPosts = [...postsByContent, ...postsByTitle];
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p._id === post._id)
      );

      // Get post authors and like counts
      const postsWithDetails = await Promise.all(
        uniquePosts.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          const likesCount = post.likesCount || 0;
          const commentsCount = post.commentsCount || 0;

          return {
            ...post,
            author: {
              _id: author?._id,
              name: author?.name,
              avatar: author?.avatar,
              profession: author?.profession,
            },
            likesCount,
            commentsCount,
            hasImages: !!post.imageUrls && post.imageUrls.length > 0
          };
        })
      );

      // Search projects by title and description
      const projectsByTitle = await ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => 
          q.search("title", term)
        )
        .take(10);

      const projectsByDescription = await ctx.db
        .query("projects")
        .withSearchIndex("search_description", (q) => 
          q.search("description", term)
        )
        .take(10);

      // Combine and deduplicate projects
      const allProjects = [...projectsByTitle, ...projectsByDescription];
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(proj => proj._id === project._id)
      );

      // Get project authors
      const projectsWithDetails = await Promise.all(
        uniqueProjects.map(async (project) => {
          const author = await ctx.db.get(project.userId);
          return {
            ...project,
            author: {
              _id: author?._id,
              name: author?.name,
              avatar: author?.avatar,
              profession: author?.profession,
            }
          };
        })
      );

      // Format results with enhanced information
      const results = [
        // Users
        ...usersWithDetails.map(user => ({
          _id: user._id,
          _creationTime: user._creationTime,
          name: user.name,
          type: 'user' as const,
          imageUrl: user.avatar,
          expertise: user.expertise || [],
          title: user.profession || 'Designer',
          bio: user.bio,
          location: user.location,
          stats: {
            posts: user.postsCount,
            followers: user.followersCount
          },
          relevance: 'high' as const
        })),

        // Posts
        ...postsWithDetails.map(post => ({
          _id: post._id,
          _creationTime: post._creationTime,
          name: post.title || post.content?.slice(0, 50) + (post.content && post.content.length > 50 ? '...' : ''),
          type: 'post' as const,
          title: post.title || 'Post',
          content: post.content,
          imageUrls: post.imageUrls,
          author: post.author,
          stats: {
            likes: post.likesCount,
            comments: post.commentsCount
          },
          hasImages: post.hasImages,
          tags: post.tags || [],
          relevance: post.content?.toLowerCase().includes(term) ? 'high' : 'medium' as const
        })),

        // Projects
        ...projectsWithDetails.map(project => ({
          _id: project._id,
          _creationTime: project._creationTime,
          name: project.title,
          type: 'project' as const,
          title: project.title,
          description: project.description,
          imageUrl: project.imageUrl,
          expertise: project.tags,
          category: project.category,
          author: project.author,
          relevance: project.title.toLowerCase().includes(term) ? 'high' : 'medium' as const
        })),
      ];

      // Sort by relevance and creation time
      return results.sort((a, b) => {
        // First sort by relevance
        const relevanceOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 };
        const aRelevance = relevanceOrder[a.relevance as 'high' | 'medium' | 'low'] || 1;
        const bRelevance = relevanceOrder[b.relevance as 'high' | 'medium' | 'low'] || 1;
        
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
        
        // Then by creation time (newest first)
        return b._creationTime - a._creationTime;
      });
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },
});

// Advanced search with filters
export const advancedSearch = query({
  args: { 
    query: v.string(),
    filters: v.object({
      type: v.optional(v.union(v.literal('users'), v.literal('posts'), v.literal('projects'))),
      category: v.optional(v.string()),
      expertise: v.optional(v.array(v.string())),
      hasImages: v.optional(v.boolean()),
      minLikes: v.optional(v.number()),
    })
  },
  handler: async (ctx, { query: searchTerm, filters }) => {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) return [];

    let results = [];

    try {
      // Search based on selected type filter
      if (!filters.type || filters.type === 'users') {
        const users = await ctx.db
          .query("users")
          .withSearchIndex("search_name", (q) => q.search("name", term))
          .take(20); // Limit results

        const usersByExpertise = await ctx.db
          .query("users")
          .withSearchIndex("search_expertise", (q) => q.search("expertise", term))
          .take(20);

        const allUsers = [...users, ...usersByExpertise];
        const uniqueUsers = allUsers.filter((user, index, self) => 
          index === self.findIndex(u => u._id === user._id)
        );

        // Apply expertise filter if provided
        const filteredUsers = filters.expertise 
          ? uniqueUsers.filter(user => 
              user.expertise?.some(exp => 
                filters.expertise!.includes(exp)
              )
            )
          : uniqueUsers;

        results.push(...filteredUsers.map(user => ({
          _id: user._id,
          type: 'user' as const,
          name: user.name,
          imageUrl: user.avatar,
          expertise: user.expertise,
          title: user.profession,
          bio: user.bio,
          _creationTime: user._creationTime
        })));
      }

      if (!filters.type || filters.type === 'posts') {
        const postsByContent = await ctx.db
          .query("posts")
          .withSearchIndex("search_content", (q) => q.search("content", term))
          .take(20);

        const postsByTitle = await ctx.db
          .query("posts")
          .withSearchIndex("search_title", (q) => q.search("title", term))
          .take(20);

        const allPosts = [...postsByContent, ...postsByTitle];
        const uniquePosts = allPosts.filter((post, index, self) => 
          index === self.findIndex(p => p._id === post._id)
        );

        // Apply filters
        let filteredPosts = uniquePosts;
        
        if (filters.hasImages !== undefined) {
          filteredPosts = filteredPosts.filter(post => 
            filters.hasImages ? post.imageUrls && post.imageUrls.length > 0 : !post.imageUrls || post.imageUrls.length === 0
          );
        }

        if (filters.minLikes) {
          filteredPosts = filteredPosts.filter(post => 
            (post.likesCount || 0) >= filters.minLikes!
          );
        }

        results.push(...filteredPosts.map(post => ({
          _id: post._id,
          type: 'post' as const,
          name: post.title || post.content?.slice(0, 50) + '...',
          content: post.content,
          imageUrls: post.imageUrls,
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
          _creationTime: post._creationTime
        })));
      }

      if (!filters.type || filters.type === 'projects') {
        const projectsByTitle = await ctx.db
          .query("projects")
          .withSearchIndex("search_title", (q) => q.search("title", term))
          .take(20);

        const projectsByDescription = await ctx.db
          .query("projects")
          .withSearchIndex("search_description", (q) => q.search("description", term))
          .take(20);

        const allProjects = [...projectsByTitle, ...projectsByDescription];
        const uniqueProjects = allProjects.filter((project, index, self) => 
          index === self.findIndex(proj => proj._id === project._id)
        );

        // Apply category filter if provided
        const filteredProjects = filters.category
          ? uniqueProjects.filter(project => 
              project.category.toLowerCase() === filters.category!.toLowerCase()
            )
          : uniqueProjects;

        results.push(...filteredProjects.map(project => ({
          _id: project._id,
          type: 'project' as const,
          name: project.title,
          description: project.description,
          imageUrl: project.imageUrl,
          category: project.category,
          tags: project.tags,
          _creationTime: project._creationTime
        })));
      }

      return results.sort((a, b) => b._creationTime - a._creationTime);
    } catch (error) {
      console.error('Advanced search error:', error);
      return [];
    }
  },
});

// Get trending searches - FIXED VERSION
export const getTrendingSearches = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Get recent search history (last 1000 items)
      const searchHistory = await ctx.db
        .query("searchHistory")
        .withIndex("by_timestamp", (q) => q.gt("timestamp", Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
        .take(1000);

      // Count occurrences of each query
      const queryCounts: Record<string, number> = {};
      searchHistory.forEach(item => {
        queryCounts[item.query] = (queryCounts[item.query] || 0) + 1;
      });

      // Sort by frequency and return top 10
      return Object.entries(queryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  },
});

// Get search suggestions
export const getSearchSuggestions = query({
  args: { query: v.string() },
  handler: async (ctx, { query: partialQuery }) => {
    if (partialQuery.length < 2) return [];

    const term = partialQuery.toLowerCase();

    try {
      // Get suggestions from users
      const userSuggestions = await ctx.db
        .query("users")
        .withSearchIndex("search_name", (q) => 
          q.search("name", term)
        )
        .take(5)
        .then(users => users.map(user => ({
          type: 'user' as const,
          text: user.name,
          id: user._id
        })));

      // Get suggestions from post titles and content
      const postSuggestions = await ctx.db
        .query("posts")
        .withSearchIndex("search_title", (q) => 
          q.search("title", term)
        )
        .take(5)
        .then(posts => posts.map(post => ({
          type: 'post' as const,
          text: post.title || post.content?.slice(0, 30) + '...',
          id: post._id
        })));

      // Get suggestions from project titles
      const projectSuggestions = await ctx.db
        .query("projects")
        .withSearchIndex("search_title", (q) => 
          q.search("title", term)
        )
        .take(5)
        .then(projects => projects.map(project => ({
          type: 'project' as const,
          text: project.title,
          id: project._id
        })));

      // Get common tags from expertise and project tags
      const allUsers = await ctx.db.query("users").take(100);
      const allProjects = await ctx.db.query("projects").take(100);

      const expertiseTags = allUsers.flatMap(user => user.expertise || []);
      const projectTags = allProjects.flatMap(project => project.tags || []);
      const allTags = [...expertiseTags, ...projectTags];

      const tagSuggestions = Array.from(new Set(allTags)) // Remove duplicates
        .filter(tag => tag.toLowerCase().includes(term))
        .slice(0, 5)
        .map(tag => ({
          type: 'tag' as const,
          text: `#${tag}`,
          id: tag
        }));

      return [
        ...userSuggestions,
        ...postSuggestions,
        ...projectSuggestions,
        ...tagSuggestions
      ].slice(0, 10); // Limit total suggestions
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  },
});

// Get popular tags
export const getPopularTags = query({
  args: {},
  handler: async (ctx) => {
    try {
      const allUsers = await ctx.db.query("users").take(100);
      const allProjects = await ctx.db.query("projects").take(100);
      const allPosts = await ctx.db.query("posts").take(100);

      const expertiseTags = allUsers.flatMap(user => user.expertise || []);
      const projectTags = allProjects.flatMap(project => project.tags || []);
      const postTags = allPosts.flatMap(post => post.tags || []);

      const allTags = [...expertiseTags, ...projectTags, ...postTags];
      
      // Count tag frequency
      const tagCounts: Record<string, number> = {};
      allTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 20)
        .map(([tag, count]) => ({ tag, count }));
    } catch (error) {
      console.error('Error getting popular tags:', error);
      return [];
    }
  },
});

// Search history functions
export const getSearchHistory = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return [];
      
      return await ctx.db
        .query("searchHistory")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .take(10);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  },
});

export const addToSearchHistory = mutation({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return;

      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      const existing = await ctx.db
        .query("searchHistory")
        .withIndex("by_user_query", (q) => 
          q.eq("userId", identity.subject).eq("query", trimmedQuery)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, { timestamp: Date.now() });
      } else {
        await ctx.db.insert("searchHistory", {
          userId: identity.subject,
          query: trimmedQuery,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error adding to search history:', error);
    }
  },
});

export const removeFromSearchHistory = mutation({
  args: { query: v.string() },
  handler: async (ctx, { query }) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return;

      const existing = await ctx.db
        .query("searchHistory")
        .withIndex("by_user_query", (q) => 
          q.eq("userId", identity.subject).eq("query", query)
        )
        .first();

      if (existing) {
        await ctx.db.delete(existing._id);
      }
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  },
});

export const clearSearchHistory = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return;

      const historyItems = await ctx.db
        .query("searchHistory")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      await Promise.all(historyItems.map(item => ctx.db.delete(item._id)));
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  },
});