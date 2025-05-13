import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { api } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update the User interface to match backend response
interface User {
  id: number;  // Ensure this is number type
  email: string;
  role: 'professor' | 'student';
  full_name: string;
  user_id: string; // This is the display ID that can be string
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect based on user role
      if (user.role === 'professor') {
        router.replace('/(tabs)'); // Professor goes to QR generation
      } else {
        router.replace('/(tabs)/student-index'); // Student goes to QR scanning
      }
    }
  }, [user, segments]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      if (response.status === 'success') {
        const userData: User = {
          ...response.user,
          id: Number(response.user.id), // Force convert to number
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
    router.replace('/(auth)/login');
  };

  // Check for existing session on app launch
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};