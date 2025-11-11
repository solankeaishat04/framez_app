// contexts/SearchContext.tsx
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
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
  bio?: string;
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

  // Get search history from Convex
  const searchHistoryData = useQuery(api.search.getSearchHistory);
  
  // Search results - only query when we have a search term
  const searchResultsData = useQuery(
    api.search.search, 
    searchQuery.trim() ? { query: searchQuery.trim() } : 'skip'
  );

  const addToHistory = useMutation(api.search.addToSearchHistory);
  const removeFromHistoryMutation = useMutation(api.search.removeFromSearchHistory);

  const performSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      clearSearch();
      return;
    }

    setSearchQuery(trimmedQuery);
    setIsSearching(true);
    
    try {
      // Add to search history
      await addToHistory({ query: trimmedQuery });
    } catch (error) {
      console.error('Error adding to search history:', error);
    } finally {
      setIsSearching(false);
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

  // Memoize derived data to prevent unnecessary re-renders
  const searchHistory = useMemo(() => 
    searchHistoryData?.map(item => item.query) || [], 
    [searchHistoryData]
  );

  const searchResults = useMemo(() => 
    (searchResultsData || []) as SearchResult[], 
    [searchResultsData]
  );

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