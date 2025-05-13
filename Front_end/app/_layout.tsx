import { AuthProvider } from '../context/AuthContext';
import { RefreshProvider } from '../context/RefreshContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </RefreshProvider>
    </AuthProvider>
  );
}