/* eslint-disable @typescript-eslint/no-unused-vars */
// screens/ProfileScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getUserSupabasePosts, SupabasePost, subscribeToPosts } from "@/service/supabasePost";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

const Profile = () => {
  const { state: authState, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<SupabasePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Get user data from Convex
  const userData = useQuery(api.users.getUserById, 
    authState.user?._id ? { userId: authState.user._id as Id<"users"> } : "skip"
  );

  // Get user stats from Convex
  const userStats = useQuery(api.users.getUserStats, 
    authState.user?._id ? { userId: authState.user._id as Id<"users"> } : "skip"
  );

  const updateUserMutation = useMutation(api.users.updateUser);

  const fetchUserPosts = useCallback(async () => {
    if (authState.user?._id) {
      try {
        setLoadingPosts(true);
        console.log("Profile: Fetching posts for user:", authState.user._id);
        const posts = await getUserSupabasePosts(authState.user._id);
        console.log("Profile: Fetched posts:", posts.length);
        setUserPosts(posts);
      } catch (error) {
        console.error("Profile: Error fetching user posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    }
  }, [authState.user?._id]);

  const handleRealTimeUpdate = useCallback(async () => {
    console.log("Profile: Real-time update received, refreshing posts...");
    await fetchUserPosts();
  }, [fetchUserPosts]);

  useEffect(() => {
    fetchUserPosts();

    console.log("Profile: Setting up real-time subscription");
    const subscription = subscribeToPosts(handleRealTimeUpdate);

    return () => {
      console.log("Profile: Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, [fetchUserPosts, handleRealTimeUpdate]);

  useEffect(() => {
    if (userData?.avatar) {
      setProfileImage(userData.avatar);
    }
  }, [userData]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need camera roll permissions to change your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && authState.user?._id) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        await updateUserMutation({
          userId: authState.user._id as Id<"users">,
          updates: { avatar: imageUri }
        });
        
        await updateProfile({ avatar: imageUri });
        
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to update profile picture");
    }
  };

  const handleEditProfile = () => {
    setSettingsVisible(false);
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async (updates: any) => {
    try {
      if (authState.user?._id) {
        await updateUserMutation({
          userId: authState.user._id as Id<"users">,
          updates
        });
        
        await updateProfile(updates);
      }
      
      setEditProfileVisible(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleLogout = () => {
    setSettingsVisible(false);
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleBack = () => {
    router.back();
  };

  if (!authState.user && !authState.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please log in to view your profile</Text>
      </View>
    );
  }

  if (authState.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5DB8E5" />
      </View>
    );
  }

  const displayUser = userData || authState.user;
  
  const userName = displayUser?.name || "User";
  const userBio = displayUser?.bio || "Welcome to Framez!";
  const userLocation = displayUser?.location || "";
  const userProfession = displayUser?.profession || "";

  const showUserDetails = userLocation || userProfession;

  // Safe stats calculation - Use Convex stats for followers/following, Supabase for posts
  const postsCount = userPosts.length;

  // Calculate likes and comments from Supabase posts
  const totalLikes = userPosts.reduce((sum, post) => {
    if (!post) return sum;
    return sum + (post.likes_count || 0);
  }, 0);


  // Use Convex stats for followers and following
  const followersCount = userStats?.followersCount || 0;
  const followingCount = userStats?.followingCount || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons name="settings-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageContainer}>
            <Image 
              source={{ 
                uri: profileImage || "https://via.placeholder.com/140x140/5DB8E5/FFFFFF?text=USER" 
              }} 
              style={styles.profileImage} 
            />
            <View style={styles.editIconContainer}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userInfo}>{userBio}</Text>
          
          {showUserDetails && (
            <Text style={styles.userDetails}>
              {userLocation} 
              {userLocation && userProfession ? ' • ' : ''} 
              {userProfession}
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
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileButtonText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Ionicons name="image-outline" size={24} color="#5DB8E5" />
            <Text style={styles.postsSectionTitle}>Your Posts ({postsCount})</Text>
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
                      onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                      onLoad={() => console.log('Profile image loaded successfully')}
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
                      <Text style={styles.postStatText}>
                        {post.likes_count || 0}
                      </Text>
                      <Ionicons name="chatbubble" size={16} color="#fff" style={styles.statIcon} />
                      <Text style={styles.postStatText}>
                        {post.comments_count || 0}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noPostsContainer}>
              <Ionicons name="camera-outline" size={50} color="#fff" />
              <Text style={styles.noPostsText}>No posts yet</Text>
              <Text style={styles.noPostsSubtext}>Share your first moment!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleEditProfile}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="person-outline" size={24} color="#5DB8E5" />
              </View>
              <Text style={styles.modalOptionText}>Edit Profile</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={styles.modalOption}
              onPress={handleLogout}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.modalOptionText, styles.logoutText]}>
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <EditProfileModal
        visible={editProfileVisible}
        user={displayUser}
        onClose={() => setEditProfileVisible(false)}
        onSave={handleSaveProfile}
      />
    </View>
  );
};

const EditProfileModal = ({ visible, user, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    profession: user?.profession || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        profession: user.profession || '',
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    onSave(formData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({...formData, name: text})}
                placeholder="Your name"
                maxLength={50}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(text) => setFormData({...formData, bio: text})}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={3}
                maxLength={150}
              />
              <Text style={styles.charCount}>
                {formData.bio.length}/150
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={formData.location}
                onChangeText={(text) => setFormData({...formData, location: text})}
                placeholder="Your location"
                maxLength={30}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Profession</Text>
              <TextInput
                style={styles.input}
                value={formData.profession}
                onChangeText={(text) => setFormData({...formData, profession: text})}
                placeholder="Your profession"
                maxLength={30}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

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
    position: "relative",
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 5,
    borderColor: "#fff",
    backgroundColor: "#E5E7EB",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#5DB8E5",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
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
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: "#5DB8E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  editProfileButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
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
  noPostsSubtext: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  logoutText: {
    color: "#EF4444",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#5DB8E5",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  editModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  cancelText: {
    fontSize: 16,
    color: "#6B7280",
  },
  saveText: {
    fontSize: 16,
    color: "#5DB8E5",
    fontWeight: "600",
  },
  editForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
    marginTop: 4,
  },
});

export default Profile;