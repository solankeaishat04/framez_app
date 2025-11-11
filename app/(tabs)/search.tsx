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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch } from '@/context/SearchContext';

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

  const renderSearchItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.resultItem}
      onPress={() => {
        if (item.type === 'user') {
          router.push('/profile');
        } else {
          router.push('/');
        }
      }}
    >
      <View style={styles.resultContent}>
        {item.imageUrl ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={[styles.avatar, styles.defaultAvatar]}>
            <Text style={styles.avatarText}>
              {item.type.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.resultName}>{item.name}</Text>
          <Text style={styles.resultType}>{item.type}</Text>
          {item.expertise && (
            <Text style={styles.expertise}>
              {item.expertise.slice(0, 3).join(' • ')}
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
      onLongPress={() => removeFromHistory(item)}
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
            placeholder="Describe what you're looking for..."
            placeholderTextColor="#999"
            value={localQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => performSearch(localQuery)}
          />
          {localQuery ? (
            <TouchableOpacity onPress={handleClear} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
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
        ) : searchQuery && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchItem}
            keyExtractor={(item) => item._id.toString()}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No results found</Text>
          </View>
        ) : (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Searches</Text>
            <FlatList
              data={searchHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
            />
            {searchHistory.length === 0 && (
              <Text style={styles.emptyHistory}>
                Your search history will appear here
              </Text>
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
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButton: {
    marginLeft: 12,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: '#666',
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
  },
  historyContainer: {
    flex: 1,
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
  },
  removeButton: {
    padding: 4,
  },
  removeText: {
    fontSize: 20,
    color: '#999',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#999',
  },
  emptyHistory: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40,
  },
});