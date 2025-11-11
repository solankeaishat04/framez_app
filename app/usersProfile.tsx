// app/user-profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getUserSupabasePosts, SupabasePost } from "@/service/supabasePost";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

export default function UserProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { state: authState } = useAuth();
  
  const [userPosts, setUserPosts] = useState<SupabasePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Get the target user's data
  const targetUser = useQuery(api.users.getUserById, 
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  // Get follow status
  const followStatus = useQuery(api.users.isFollowing, 
    authState.user?._id && userId ? {
      followerId: authState.user._id as Id<"users">,
      followingId: userId as Id<"users">
    } : "skip"
  );

  // Get user stats
  const userStats = useQuery(api.users.getUserStats, 
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  const followUserMutation = useMutation(api.users.followUser);
  const unfollowUserMutation = useMutation(api.users.unfollowUser);

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);

  const fetchUserPosts = useCallback(async () => {
    if (userId) {
      try {
        setLoadingPosts(true);
        const posts = await getUserSupabasePosts(userId as string);
        setUserPosts(posts);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const handleFollow = async () => {
    if (!authState.user?._id || !userId) {
      Alert.alert("Error", "Please log in to follow users");
      return;
    }

    try {
      if (isFollowing) {
        await unfollowUserMutation({
          userId: authState.user._id as Id<"users">,
          targetUserId: userId as Id<"users">
        });
        setIsFollowing(false);
        Alert.alert("Success", "Unfollowed user");
      } else {
        await followUserMutation({
          userId: authState.user._id as Id<"users">,
          targetUserId: userId as Id<"users">
        });
        setIsFollowing(true);
        Alert.alert("Success", "Following user");
      }
    } catch (error) {
      console.error("Error following user:", error);
      Alert.alert("Error", "Failed to update follow status");
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleMessage = () => {
    Alert.alert("Message", "Message functionality coming soon!");
  };

  if (!targetUser) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5DB8E5" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const postsCount = userPosts.length;
  const followersCount = userStats?.followersCount || 0;
  const followingCount = userStats?.followingCount || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: targetUser.avatar || "https://via.placeholder.com/140x140/5DB8E5/FFFFFF?text=USER" 
              }} 
              style={styles.profileImage} 
            />
          </View>

          <Text style={styles.userName}>{targetUser.name}</Text>
          <Text style={styles.userInfo}>{targetUser.bio || "Welcome to Framez!"}</Text>
          
          {(targetUser.location || targetUser.profession) && (
            <Text style={styles.userDetails}>
              {targetUser.location} 
              {targetUser.location && targetUser.profession ? ' • ' : ''} 
              {targetUser.profession}
            </Text>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>POSTS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={handleMessage}
            >
              <Text style={styles.messageButtonText}>MESSAGE</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.followButton, isFollowing && styles.unfollowButton]}
              onPress={handleFollow}
            >
              <Text style={[styles.followButtonText, isFollowing && styles.unfollowButtonText]}>
                {isFollowing ? "UNFOLLOW" : "FOLLOW"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Ionicons name="image-outline" size={24} color="#5DB8E5" />
            <Text style={styles.postsSectionTitle}>Posts ({postsCount})</Text>
          </View>

          {loadingPosts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Loading posts...</Text>
            </View>
          ) : userPosts.length > 0 ? (
            <View style={styles.postsGrid}>
              {userPosts.map((post) => (
                <TouchableOpacity key={post.id} style={styles.postItem}>
                  {post.image_urls && post.image_urls.length > 0 && post.image_urls[0] ? (
                    <Image 
                      source={{ uri: post.image_urls[0] }} 
                      style={styles.postImage} 
                    />
                  ) : (
                    <View style={styles.textPost}>
                      <Text style={styles.postText} numberOfLines={4}>
                        {post.content || "No content"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.postOverlay}>
                    <View style={styles.postStats}>
                      <Ionicons name="heart" size={16} color="#fff" />
                      <Text style={styles.postStatText}>{post.likes_count || 0}</Text>
                      <Ionicons name="chatbubble" size={16} color="#fff" style={styles.statIcon} />
                      <Text style={styles.postStatText}>{post.comments_count || 0}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noPostsContainer}>
              <Ionicons name="camera-outline" size={50} color="#fff" />
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5DB8E5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileHeader: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileImageContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: "#E5E7EB",
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  userInfo: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 8,
    textAlign: "center",
  },
  userDetails: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 24,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  messageButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  followButton: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  unfollowButton: {
    backgroundColor: "#EF4444",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  unfollowButtonText: {
    color: "#fff",
  },
  postsSection: {
    backgroundColor: "#5DB8E5",
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 200,
  },
  postsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 10,
  },
  postsSectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  postItem: {
    width: (width - 52) / 2,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
    position: "relative",
  },
  postImage: {
    width: "100%",
    height: "100%",
  },
  postOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  postStatText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  statIcon: {
    marginLeft: 12,
  },
  textPost: {
    padding: 12,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  postText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 18,
    textAlign: "center",
  },
  noPostsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  noPostsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5DB8E5",
  },
});