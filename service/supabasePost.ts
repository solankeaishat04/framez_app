// service/supabasePost.ts
import { supabase } from '@/lib/supabase';

export interface SupabasePost {
  id: string;
  content: string;
  image_urls: string[];
  author_id: string;
  author_name: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  title?: string;
  tags: string[];
}

// service/supabasePost.ts - FIXED FOR REACT NATIVE
export const createSupabasePost = async (postData: {
  content: string;
  images: any[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title?: string;
  tags?: string[];
}): Promise<string> => {
  try {
    const imageUrls: string[] = [];
    
    console.log('Starting image upload process...');
    
    // Upload images to Supabase Storage
    for (const image of postData.images) {
      try {
        // Generate a unique filename
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        console.log('Uploading image:', fileName);
        console.log('Image URI:', image.uri);
        
        // React Native compatible approach - use FormData directly
        const formData = new FormData();
        formData.append('file', {
          uri: image.uri,
          type: `image/${fileExt}`,
          name: fileName,
        } as any);

        console.log('FormData created, uploading...');

        // Upload to Supabase Storage using FormData
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, formData, {
            contentType: `image/${fileExt}`,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Upload error details:', uploadError);
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        console.log('Upload successful:', uploadData);

        // Get public URL
        const publicUrl = `https://gkauomhzipvdhzpyufjp.supabase.co/storage/v1/object/public/posts/${fileName}`;
        console.log('Generated public URL:', publicUrl);
        
        imageUrls.push(publicUrl);
        console.log('Image URL added to array');
        
      } catch (imageError) {
        console.error('Error uploading single image:', imageError);
        throw imageError;
      }
    }

    console.log('All images uploaded, creating post with URLs:', imageUrls);

    // Create post in Supabase
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        content: postData.content,
        image_urls: imageUrls,
        author_id: postData.authorId,
        author_name: postData.authorName,
        author_avatar: postData.authorAvatar,
        likes_count: 0,
        comments_count: 0,
        title: postData.title || '',
        tags: postData.tags || [],
        created_at: new Date().toISOString(),
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after post creation');
    }

    console.log('Post created successfully:', data[0]);
    return data[0].id;
  } catch (error) {
    console.error('Error creating Supabase post:', error);
    throw error;
  }
};

export const getSupabasePosts = async (): Promise<SupabasePost[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching Supabase posts:', error);
    return [];
  }
};

export const getUserSupabasePosts = async (userId: string): Promise<SupabasePost[]> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user Supabase posts:', error);
    return [];
  }
};

export const toggleLike = async (postId: string, userId: string): Promise<{ likes_count: number; user_has_liked: boolean }> => {
  try {
    // Check if user already liked this post
    const { data: existingLike, error: checkError } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    const userHasLiked = !!existingLike;

    if (userHasLiked) {
      // Unlike: Remove like record
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Decrement likes count
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      const newLikesCount = Math.max(0, (post.likes_count || 0) - 1);

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', postId)
        .select('likes_count')
        .single();

      if (updateError) throw updateError;

      return { likes_count: updatedPost.likes_count, user_has_liked: false };
    } else {
      // Like: Add like record
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: userId,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Increment likes count
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('likes_count')
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      const newLikesCount = (post.likes_count || 0) + 1;

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update({ likes_count: newLikesCount })
        .eq('id', postId)
        .select('likes_count')
        .single();

      if (updateError) throw updateError;

      return { likes_count: updatedPost.likes_count, user_has_liked: true };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const checkUserLike = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking user like:', error);
    return false;
  }
};

export const deletePost = async (postId: string, userId: string): Promise<void> => {
  try {
    // Verify the user owns the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('author_id, image_urls')
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    if (post.author_id !== userId) {
      throw new Error('Not authorized to delete this post');
    }

    // Delete associated images from storage
    if (post.image_urls && post.image_urls.length > 0) {
      const filesToDelete = post.image_urls.map((url: string) => {
        const fileName = url.split('/').pop();
        return fileName;
      }).filter(Boolean);

      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('posts')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
        }
      }
    }

    // Delete post likes first
    const { error: likesError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId);

    if (likesError) {
      console.error('Error deleting post likes:', likesError);
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

export const subscribeToPosts = (callback: (posts: SupabasePost[]) => void) => {
  console.log('Setting up real-time subscription for posts...');
  
  const subscription = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'posts'
      },
      async (payload) => {
        console.log('Real-time update received:', payload.eventType);
        
        try {
          const updatedPosts = await getSupabasePosts();
          console.log('Calling callback with', updatedPosts.length, 'posts');
          callback(updatedPosts);
        } catch (error) {
          console.error('Error fetching updated posts:', error);
        }
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });

  return subscription;
};

export const fixExistingPostUrls = async (): Promise<void> => {
  try {
    console.log('Fixing existing post URLs...');
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*');
    
    if (error) throw error;
    
    for (const post of posts || []) {
      if (post.image_urls && post.image_urls.length > 0) {
        const fixedUrls = post.image_urls.map((url: string) => {
          if (url.includes('/posts/posts/')) {
            const fileName = url.split('/').pop();
            const fixedUrl = `https://gkauomhzipvdhzpyufjp.supabase.co/storage/v1/object/public/posts/${fileName}`;
            console.log('Fixed URL:', url, '→', fixedUrl);
            return fixedUrl;
          }
          return url;
        });
        
        const { error: updateError } = await supabase
          .from('posts')
          .update({ image_urls: fixedUrls })
          .eq('id', post.id);
        
        if (updateError) {
          console.error('Error updating post:', post.id, updateError);
        } else {
          console.log('Fixed URLs for post:', post.id);
        }
      }
    }
    
    console.log('URL fixing completed');
  } catch (error) {
    console.error('Error fixing URLs:', error);
  }
};