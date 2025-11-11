
// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: number;
  bio?: string;
  location?: string;
  profession?: string;
  expertise?: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCheckedAuth: boolean; // Add this to track if we've completed initial auth check
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SIGNIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'AUTH_CHECK_COMPLETE' }; // Add this action

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SIGNIN_SUCCESS':
      return { 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false,
        hasCheckedAuth: true 
      };
    case 'LOGOUT':
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        hasCheckedAuth: true 
      };
    case 'UPDATE_USER':
      return { 
        ...state, 
        user: state.user ? { ...state.user, ...action.payload } : null 
      };
    case 'AUTH_CHECK_COMPLETE':
      return {
        ...state,
        hasCheckedAuth: true,
        isLoading: false
      };
    default:
      return state;
  }
};

interface AuthContextType {
  state: AuthState;
  signin: (email: string, password: string) => Promise<void>;
  signup: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    hasCheckedAuth: false, // Initialize as false
  });

  const router = useRouter();
  const segments = useSegments();

  const signinMutation = useMutation(api.auth.authenticateUser);
  const signupMutation = useMutation(api.auth.createUser);
  const updateUserMutation = useMutation(api.users.updateUser);

  useEffect(() => {
    checkExistingSession();
  }, []);

  // Enhanced route protection
  useEffect(() => {
    // Only run protection after we've completed the initial auth check
    if (!state.hasCheckedAuth) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnboarding = segments[0] === undefined;

    console.log('Auth State:', {
      isAuthenticated: state.isAuthenticated,
      currentSegment: segments[0],
      inAuthGroup,
      inTabsGroup
    });

    if (!state.isAuthenticated) {
      // If not authenticated, only allow auth pages and onboarding
      if (inTabsGroup) {
        console.log('Redirecting to signin - not authenticated');
        router.replace('/(auth)/signin');
      }
    } else {
      // If authenticated, redirect away from auth pages
      if (inAuthGroup || isOnboarding) {
        console.log('Redirecting to home - already authenticated');
        router.replace('/(tabs)/home');
      }
    }
  }, [state.isAuthenticated, segments, state.hasCheckedAuth, router]);

  const checkExistingSession = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SIGNIN_SUCCESS', payload: user });
      } else {
        // No existing session found
        dispatch({ type: 'AUTH_CHECK_COMPLETE' });
      }
    } catch (error) {
      console.error('Session check failed:', error);
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
    }
  };

  const signin = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await signinMutation({ email, password });
      
      if (result) {
        const userData: User = {
          _id: result._id,
          name: result.name,
          email: result.email,
          avatar: result.avatar,
          bio: result.bio,
          location: result.location,
          profession: result.profession,
          expertise: result.expertise,
          createdAt: result.createdAt,
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        dispatch({ type: 'SIGNIN_SUCCESS', payload: userData });
        
        // Navigation will be handled by the useEffect above
      } else {
        throw new Error('Sign in failed - invalid response');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const signup = async (userData: { name: string; email: string; password: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await signupMutation(userData);
      
      const newUser: User = {
        _id: result._id,
        name: result.name,
        email: result.email,
        avatar: result.avatar,
        bio: result.bio,
        location: result.location,
        profession: result.profession,
        expertise: result.expertise,
        createdAt: result.createdAt,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      dispatch({ type: 'SIGNIN_SUCCESS', payload: newUser });
      
      // Navigation will be handled by the useEffect above
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.message || 'Sign up failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      dispatch({ type: 'LOGOUT' });
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (state.user) {
      try {
        await updateUserMutation({
          userId: state.user._id as any,
          updates
        });
        
        const updatedUser = { ...state.user, ...updates };
        dispatch({ type: 'UPDATE_USER', payload: updates });
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Profile update failed:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ state, signin, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};