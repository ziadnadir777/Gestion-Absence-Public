import { AuthProvider } from '../context/AuthContext';
import { RefreshProvider } from '../context/RefreshContext';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RefreshProvider>
        <Slot />
      </RefreshProvider>
    </AuthProvider>
  );
}
