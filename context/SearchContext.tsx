// contexts/SearchContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export interface SearchResult {
  _id: string;
  _creationTime: number;
  name: string;
  type: 'user' | 'project' | 'post';
  imageUrl?: string;
  title?: string;
  expertise?: string[];
}

interface SearchContextType {
  searchQuery: string;
  searchResults: SearchResult[];
  searchHistory: string[];
  isSearching: boolean;
  performSearch: (query: string) => void;
  clearSearch: () => void;
  removeFromHistory: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Get search history from Convex - FIXED: Add proper error handling
  const searchHistoryData = useQuery(api.search.getSearchHistory);
  
  // FIXED: Better query handling with proper typing
  const searchResultsData = useQuery(
    api.search.search, 
    searchQuery ? { query: searchQuery } : "skip"
  );

  const addToHistory = useMutation(api.search.addToSearchHistory);
  const removeFromHistoryMutation = useMutation(api.search.removeFromSearchHistory);

  const performSearch = async (query: string) => {
    if (query.trim()) {
      setSearchQuery(query);
      setIsSearching(true);
      try {
        await addToHistory({ query: query.trim() });
      } catch (error) {
        console.error('Error adding to search history:', error);
      } finally {
        setIsSearching(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const removeFromHistory = async (query: string) => {
    try {
      await removeFromHistoryMutation({ query });
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  };

  // FIXED: Ensure we always have arrays and proper data types
  const searchHistory = searchHistoryData?.map(item => item.query) || [];
  const searchResults = (searchResultsData || []) as SearchResult[];

  const value: SearchContextType = {
    searchQuery,
    searchResults,
    searchHistory,
    isSearching,
    performSearch,
    clearSearch,
    removeFromHistory,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};