import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from './firebaseConfig';
import { AuthUser } from './src/types/auth';
import RootNavigator from './src/navigation/RootNavigator';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🚀 App Started');

    const timeout = setTimeout(() => {
      console.log('⏰ Firebase timeout');
      setLoading(false);
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);

      console.log('🔥 Auth State Changed:', firebaseUser);

      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (snap.exists()) {
            const profile = snap.data() as AuthUser;

            console.log('✅ User Profile:', profile);

            setUser(profile);
          } else {
            console.log('❌ User document not found');

            setUser(null);
          }
        } catch (error) {
          console.log('❌ Firestore Error:', error);
          setUser(null);
        }
      } else {
        console.log('👋 User Logged Out');

        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B1120',
        }}
      >
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}