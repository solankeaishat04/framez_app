// app/(tabs)/home.tsx
import { Image } from 'expo-image';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  ActionSheetIOS
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { 
  SupabasePost, 
  getSupabasePosts, 
  subscribeToPosts, 
  toggleLike, 
  checkUserLike,
  deletePost,
  fixExistingPostUrls
} from '@/service/supabasePost';

export default function HomeScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<SupabasePost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const { state } = useAuth();
  const currentUser = state.user;

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const supabasePosts = await getSupabasePosts();
      console.log('Fetched posts:', supabasePosts.length);
      
      if (currentUser) {
        const likedPostIds = new Set<string>();
        for (const post of supabasePosts) {
          const hasLiked = await checkUserLike(post.id, currentUser._id);
          if (hasLiked) {
            likedPostIds.add(post.id);
          }
        }
        setLikedPosts(likedPostIds);
      }
      
      setPosts(supabasePosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handleRealTimeUpdate = useCallback(async (newPosts: SupabasePost[]) => {
    console.log('Home: Processing real-time update with', newPosts.length, 'posts');
    
    setPosts(newPosts);
    
    if (currentUser) {
      const likedPostIds = new Set<string>();
      for (const post of newPosts) {
        const hasLiked = await checkUserLike(post.id, currentUser._id);
        if (hasLiked) {
          likedPostIds.add(post.id);
        }
      }
      setLikedPosts(likedPostIds);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchPosts();
    fixExistingPostUrls();

    console.log('Home: Setting up real-time subscription');
    const subscription = subscribeToPosts(handleRealTimeUpdate);

    return () => {
      console.log('Home: Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, [fetchPosts, handleRealTimeUpdate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to like posts');
      return;
    }

    try {
      const result = await toggleLike(postId, currentUser._id);
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, likes_count: result.likes_count }
            : post
        )
      );

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (result.user_has_liked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleUserPress = (post: SupabasePost) => {
    if (post.author_id) {
      router.push({
      pathname: "/usersProfile",
      params: { userId: post.author_id }
    });
    
    }
  };

  const showPostOptions = (post: SupabasePost) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Delete Post'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleDeletePost(post.id);
          }
        }
      );
    } else {
      Alert.alert(
        'Post Options',
        'Choose an action',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete Post', 
            style: 'destructive',
            onPress: () => handleDeletePost(post.id)
          },
        ]
      );
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId, currentUser._id);
              Alert.alert('Success', 'Post deleted successfully');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffSeconds = Math.floor(diffTime / 1000);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return '1 day ago';
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString();
  };

  const renderPost = ({ item }: { item: SupabasePost }) => (
    <ThemedView style={styles.postCard}>
      <ThemedView style={styles.postHeader}>
        <TouchableOpacity 
          style={styles.userInfo}
          onPress={() => handleUserPress(item)}
        >
          {item.author_avatar ? (
            <Image
              source={{ uri: item.author_avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <ThemedView style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={24} color="#666" />
            </ThemedView>
          )}
          <ThemedView style={styles.userDetails}>
            <ThemedText type="defaultSemiBold" style={styles.userName}>
              {item.author_name || 'Anonymous'}
            </ThemedText>
            <ThemedText type="subtitle" style={styles.timeAgo}>
              {formatDate(item.created_at)}
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
        
        {currentUser && item.author_id === currentUser._id && (
          <TouchableOpacity onPress={() => showPostOptions(item)}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </ThemedView>

      {item.content && (
        <ThemedText style={styles.postContent}>
          {item.content}
        </ThemedText>
      )}

      {item.image_urls && item.image_urls.length > 0 && item.image_urls[0] ? (
        <ThemedView style={styles.imagesContainer}>
          {item.image_urls.map((imageUrl, index) => (
            <Image
              key={`${item.id}-${index}`}
              source={{ uri: imageUrl }}
              style={[
                styles.postImage,
                item.image_urls.length === 1 ? styles.singleImage : styles.multiImage
              ]}
              contentFit="cover"
              transition={1000}
              onError={(error) => console.log('Image load error for URL:', imageUrl, error)}
              onLoad={() => console.log('Image loaded successfully:', imageUrl)}
            />
          ))}
        </ThemedView>
      ) : (
        <ThemedView style={styles.noImageContainer}>
          <Ionicons name="image-outline" size={40} color="#CCC" />
          <ThemedText style={styles.noImageText}>No image</ThemedText>
        </ThemedView>
      )}

      {item.tags && item.tags.length > 0 && (
        <ThemedView style={styles.tagsContainer}>
          {item.tags.map((tag, index) => (
            <ThemedText key={index} style={styles.tag}>
              #{tag}
            </ThemedText>
          ))}
        </ThemedView>
      )}

      <ThemedView style={styles.actionsContainer}>
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons 
              name={likedPosts.has(item.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={likedPosts.has(item.id) ? "#FF3B30" : "#333"} 
            />
            <ThemedText style={[
              styles.actionText,
              { color: likedPosts.has(item.id) ? "#FF3B30" : "#333" }
            ]}>
              {item.likes_count || 0}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={22} color="#333" />
            <ThemedText style={styles.actionText}>
              {item.comments_count || 0}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={22} color="#333" />
          </TouchableOpacity>
        </ThemedView>

        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={22} color="#333" />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <Image 
          style={styles.logo} 
          source={require('../../assets/images/LOGOFRAMEZ-removebg-preview.png')}
        />
        <ThemedView style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="mail-outline" size={24} color="#333" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {loading ? (
        <ThemedView style={styles.loadingContainer}>
          <Ionicons name="images" size={50} color="#E5E5E5" />
          <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.feedContainer,
            posts.length === 0 && styles.emptyFeedContainer
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#5DB8E5"
            />
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyState}>
              <Ionicons name="images" size={80} color="#E5E5E5" />
              <ThemedText style={styles.emptyText}>No posts yet</ThemedText>
              <ThemedText type="subtitle" style={styles.emptySubtext}>
                Be the first to share something amazing!
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffff',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 20,
  },
  headerIcon: {
    padding: 4,
  },
  feedContainer: {
    paddingBottom: 20,
  },
  emptyFeedContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  userDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    color: '#fff',
  },
  timeAgo: {
    fontSize: 13,
    color: '#7bafd2ff',
    fontWeight: '500',
  },
  postContent: {
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 20,
    color: '#333',
  },
  imagesContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postImage: {
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    marginBottom: 8,
  },
  singleImage: {
    width: '100%',
    height: 400,
  },
  multiImage: {
    width: '100%',
    height: 300,
  },
  noImageContainer: {
    paddingHorizontal: 16,
    height: 200,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  noImageText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tag: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontWeight: '600',
    overflow: 'hidden',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    lineHeight: 22,
  },
});