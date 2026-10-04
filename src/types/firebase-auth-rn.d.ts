import type { Persistence } from 'firebase/auth';

// firebase/auth ships this export only in its React Native bundle, so the default
// (web) typings don't declare it. Metro resolves the RN build at runtime.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
