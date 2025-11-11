// app/(tabs)/search.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text, 
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch, SearchResult } from '@/context/SearchContext';

export default function SearchScreen() {
  const router = useRouter();
  const {
    searchQuery,
    searchResults,
    searchHistory,
    isSearching,
    performSearch,
    clearSearch,
    removeFromHistory,
  } = useSearch();

  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setLocalQuery(query);
    if (query.length >= 2) {
      performSearch(query);
    } else if (query.length === 0) {
      clearSearch();
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    clearSearch();
    Keyboard.dismiss();
  };

  const handleHistoryItemPress = (query: string) => {
    setLocalQuery(query);
    performSearch(query);
  };

  const handleUserPress = (user: SearchResult) => {
    if (user.type === 'user') {
      router.push({
        pathname: "/usersProfile",
        params: { userId: user._id }
      });
    }
    // Add navigation for other types if needed
    // if (user.type === 'post') {
    //   router.push(`/post/${user._id}`);
    // }
  };

  const renderSearchItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.resultContent}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultType}>{item.type}</Text>
          {item.expertise && item.expertise.length > 0 && (
            <Text style={styles.expertise} numberOfLines={1}>
              {item.expertise.slice(0, 3).join(' • ')}
            </Text>
          )}
          {item.title && (
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.historyItem}
      onPress={() => handleHistoryItemPress(item)}
    >
      <Text style={styles.historyText}>⌕ {item}</Text>
      <TouchableOpacity 
        onPress={() => removeFromHistory(item)}
        style={styles.removeButton}
      >
        <Text style={styles.removeText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users, posts..."
            placeholderTextColor="#999"
            value={localQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => localQuery.trim() && performSearch(localQuery)}
          />
          {localQuery ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search Results or History */}
      <View style={styles.resultsContainer}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : localQuery && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : localQuery ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results found for &quot;{localQuery}&quot;</Text>
            <Text style={styles.noResultsSubtext}>Try different keywords</Text>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {searchHistory.length > 0 && (
              <>
                <Text style={styles.historyTitle}>Recent Searches</Text>
                <FlatList
                  data={searchHistory}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => index.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                />
              </>
            )}
            {searchHistory.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>Start searching</Text>
                <Text style={styles.emptyStateText}>
                  Find users, posts, and projects in your community
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingRight: 40, // Space for clear button
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  clearText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  textContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    color: '#1F2937',
  },
  resultType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  expertise: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  historyContainer: {
    flex: 1,
    paddingTop: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  removeButton: {
    padding: 4,
    marginLeft: 8,
  },
  removeText: {
    fontSize: 20,
    color: '#999',
    fontWeight: '300',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});