// app/(tabs)/post.tsx
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Alert,
  Platform,
  StatusBar
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'expo-router'
import { createSupabasePost } from '@/service/supabasePost'
import { Button } from '@/components/ui/Button'

type ImageAsset = {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  name?: string;
}

export default function Post() {
  const [caption, setCaption] = useState('')
  const [selectedImages, setSelectedImages] = useState<ImageAsset[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { state } = useAuth()
  const router = useRouter()

  const currentUser = state.user;

  // Request permission and pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to select images')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
      selectionLimit: 5,
    })

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`
      }))
      setSelectedImages([...selectedImages, ...newImages])
    }
  }

  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    })

    if (!result.canceled && result.assets && result.assets[0]) {
      const newImage = {
        uri: result.assets[0].uri,
        width: result.assets[0].width,
        height: result.assets[0].height,
        type: 'image/jpeg',
        name: `camera_${Date.now()}.jpg`
      }
      setSelectedImages([...selectedImages, newImage])
    }
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    setSelectedImages(newImages)
  }

  // Helper function to extract hashtags
  const extractHashtags = (text: string) => {
    const hashtags = text.match(/#[\w]+/g);
    return hashtags ? hashtags.map(tag => tag.substring(1)) : [];
  }

  // In your post.tsx - update the image format
const handlePost = async () => {
  if (!caption.trim() && selectedImages.length === 0) {
    Alert.alert('Error', 'Please add a caption or select images');
    return;
  }

  if (!currentUser) {
    Alert.alert('Error', 'Please log in to create posts');
    return;
  }

  setIsSubmitting(true);

  try {
    // Convert images to format expected by Supabase
    const imagesForUpload = selectedImages.map(img => ({
      uri: img.uri,
      type: 'image/jpeg',
      fileName: img.name || `image_${Date.now()}.jpg`
    }));

    // Use Supabase for post creation
    await createSupabasePost({
      content: caption.trim(),
      images: imagesForUpload,
      authorId: currentUser._id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      tags: extractHashtags(caption),
    });

    // Reset form and navigate
    setCaption('');
    setSelectedImages([]);
    
    Alert.alert('Success', 'Post created successfully!', [
      {
        text: 'OK',
        onPress: () => {
          router.push('/(tabs)/home');
        }
      }
    ]);
  } catch (error: any) {
    console.error('Error creating post:', error);
    Alert.alert('Error', error.message || 'Failed to create post. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content"/>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Post</Text>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            {currentUser?.avatar ? (
              <Image source={{ uri: currentUser.avatar }} style={styles.userAvatar} />
            ) : (
              <View style={[styles.userAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarPlaceholder}>
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{currentUser?.name || 'Anonymous'}</Text>
              <Text style={styles.userProfession}>{currentUser?.profession || 'User'}</Text>
            </View>
          </View>

          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind? Use #hashtags to categorize your post..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>
              {caption.length}/500
            </Text>
          </View>

          {/* Selected Images Grid */}
          {selectedImages.length > 0 && (
            <View style={styles.imagesContainer}>
              <Text style={styles.sectionTitle}>Selected Images ({selectedImages.length}/5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imagesGrid}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Add to your post</Text>
            
            {/* Gallery Button */}
            <View style={styles.buttonWrapper}>
              <Button
                title={selectedImages.length >= 5 ? 'Maximum 5 images reached' : 'Photo from Gallery'}
                onPress={pickImage}
                variant="outline"
                disabled={selectedImages.length >= 5}
                loading={false}
              />
            </View>

            {/* Camera Button */}
            <View style={styles.buttonWrapper}>
              <Button
                title={selectedImages.length >= 5 ? 'Maximum 5 images reached' : 'Take Photo'}
                onPress={takePhoto}
                variant="outline"
                disabled={selectedImages.length >= 5}
                loading={false}
              />
            </View>
          </View>

          {/* Upload Progress */}
          {isSubmitting && selectedImages.length > 0 && (
            <View style={styles.uploadProgress}>
              <Text style={styles.uploadProgressText}>
                Uploading {selectedImages.length} image(s)...
              </Text>
            </View>
          )}

          {/* Post Button */}
          <View style={styles.buttonWrapper}>
            <Button
              title={isSubmitting ? 'Posting...' : 'Post'}
              onPress={handlePost}
              variant="gradient"
              loading={isSubmitting}
              disabled={isSubmitting || (!caption.trim() && selectedImages.length === 0)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollView: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userProfession: {
    fontSize: 14,
    color: '#666',
  },
  captionContainer: {
    marginBottom: 24,
    position: 'relative',
  },
  captionInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    paddingBottom: 30,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#999',
  },
  imagesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  uploadProgress: {
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 16,
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
})