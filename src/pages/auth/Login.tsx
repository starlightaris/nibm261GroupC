import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParams } from '../../navigation/types';
import { loginUser, resetPassword } from '../../services/authService';
import { Colors, Radius, Spacing } from '../../styles/tokens';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParams, 'Login'>;
};

export default function Login({ navigation }: Props) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);


  const handleLogin = async () => {

    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing fields',
        'Please enter your email and password.'
      );
      return;
    }


    setLoading(true);

    try {

      await loginUser(
        email.trim(),
        password
      );

      // Auth state change will automatically trigger navigation to appropriate tabs


    } catch (e: any) {

      const msg =
        e.code === 'auth/user-not-found' ||
        e.code === 'auth/wrong-password'
          ? 'Incorrect email or password.'
          : e.message;


      Alert.alert(
        'Login failed',
        msg
      );

    } finally {

      setLoading(false);

    }
  };


  const handleForgot = async () => {

    if (!email.trim()) {
      Alert.alert(
        'Enter email first',
        'Type your email above, then tap Forgot Password.'
      );
      return;
    }


    try {

      await resetPassword(email.trim());

      Alert.alert(
        'Email sent',
        'Check your inbox for a password reset link.'
      );


    } catch {

      Alert.alert(
        'Error',
        'Could not send reset email.'
      );

    }

  };


  return (

    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >


        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.logoBox}>
            <Text style={styles.logoIcon}>
              🚍
            </Text>
          </View>


          <Text style={styles.appName}>
            TransportApp
          </Text>


          <Text style={styles.tagline}>
            Your journey starts here
          </Text>


        </View>



        {/* CARD */}

        <View style={styles.card}>


          <Text style={styles.cardTitle}>
            Sign In
          </Text>



          



          {/* EMAIL */}

          <View style={styles.inputGroup}>

            <Text style={styles.inputLabel}>
              Email Address
            </Text>


            <TextInput

              style={styles.input}

              placeholder="you@example.com"

              placeholderTextColor={Colors.muted}

              keyboardType="email-address"

              autoCapitalize="none"

              autoCorrect={false}

              value={email}

              onChangeText={setEmail}

            />

          </View>




          {/* PASSWORD */}

          <View style={styles.inputGroup}>


            <Text style={styles.inputLabel}>
              Password
            </Text>



            <View style={styles.passRow}>


              <TextInput

                style={[
                  styles.input,
                  {
                    flex:1,
                    marginBottom:0
                  }
                ]}

                placeholder="••••••••"

                placeholderTextColor={Colors.muted}

                secureTextEntry={!showPass}

                value={password}

                onChangeText={setPassword}

              />



              <TouchableOpacity

                onPress={() =>
                  setShowPass(!showPass)
                }

                style={styles.eyeBtn}

              >

                <Text style={styles.eyeIcon}>
                  {showPass ? '🙈' : '👁️'}
                </Text>


              </TouchableOpacity>



            </View>


          </View>




          {/* FORGOT */}


          <TouchableOpacity
            onPress={handleForgot}
            style={styles.forgotRow}
          >

            <Text style={styles.forgotText}>
              Forgot Password?
            </Text>

          </TouchableOpacity>





          {/* LOGIN BUTTON */}


          <TouchableOpacity

            style={styles.primaryBtn}

            onPress={handleLogin}

            disabled={loading}

          >

            {

              loading

              ?

              <ActivityIndicator color="#fff"/>

              :

              <Text style={styles.primaryBtnText}>
                Sign In 
              </Text>

            }


          </TouchableOpacity>






          {/* CREATE ACCOUNT */}



          <View style={styles.divider}>


            <View style={styles.dividerLine}/>


            <Text style={styles.dividerText}>
              New to TransportApp?
            </Text>


            <View style={styles.dividerLine}/>


          </View>





          <TouchableOpacity

            style={styles.secondaryBtn}

            onPress={() =>
              navigation.navigate('RoleSelect')
            }

          >


            <Text style={styles.secondaryBtnText}>

              Create Account →

            </Text>


          </TouchableOpacity>




        </View>



        <Text style={styles.footer}>

          By signing in you agree to our Terms & Privacy Policy

        </Text>



      </ScrollView>


    </KeyboardAvoidingView>

  );

}





const INPUT_BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingTop: 60 },

  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoIcon: { fontSize: 36 },
  appName: { color: Colors.textPrimary, fontSize: 24, fontWeight: '800' },
  tagline: { color: Colors.textSecondary, marginTop: Spacing.xs },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.xl,
  },

  roleHint: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  roleHintText: { color: Colors.textSecondary, fontSize: 13 },

  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.bg,
    color: Colors.textPrimary,
    borderRadius: Radius.button,
    padding: 14,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
  },
  passRow: { flexDirection: 'row', gap: Spacing.sm },
  eyeBtn: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: Radius.button,
    padding: 14,
  },
  eyeIcon: { fontSize: 16 },

  forgotRow: { alignItems: 'flex-end', marginBottom: Spacing.xl },
  forgotText: { color: Colors.primary, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  primaryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: INPUT_BORDER },
  dividerText: { color: Colors.muted, fontSize: 12 },

  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.button,
    padding: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: Colors.primary, fontWeight: '700' },

  footer: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
