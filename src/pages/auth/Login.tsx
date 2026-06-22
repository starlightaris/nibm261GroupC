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

              placeholderTextColor="#4A5568"

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

                placeholderTextColor="#4A5568"

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
              navigation.navigate('PassengerSignUp')
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





const COLORS = {

  bg:'#0B1120',

  card:'#141E30',

  border:'#1E2D45',

  passenger:'#6C63FF',

  text:'#E2E8F0',

  muted:'#64748B',

  input:'#0F1927',

};





const styles = StyleSheet.create({


root:{
  flex:1,
  backgroundColor:COLORS.bg
},


scroll:{
  flexGrow:1,
  padding:20,
  paddingTop:60
},



header:{
 alignItems:'center',
 marginBottom:32
},



logoBox:{

 width:72,
 height:72,
 borderRadius:20,
 backgroundColor:'#1A2540',
 justifyContent:'center',
 alignItems:'center',
 marginBottom:12,
 borderWidth:1,
 borderColor:'#2A3A5C'

},



logoIcon:{
 fontSize:36
},



appName:{
 color:COLORS.text,
 fontSize:24,
 fontWeight:'800'
},



tagline:{
 color:COLORS.muted,
 marginTop:4
},




card:{

 backgroundColor:COLORS.card,
 borderRadius:24,
 padding:24,
 borderWidth:1,
 borderColor:COLORS.border

},




cardTitle:{

 color:COLORS.text,
 fontSize:22,
 fontWeight:'800',
 marginBottom:20

},




roleHint:{

 backgroundColor:'#1A1640',
 borderRadius:10,
 padding:12,
 marginBottom:20

},



roleHintText:{

 color:COLORS.muted,
 fontSize:13

},




inputGroup:{
 marginBottom:16
},



inputLabel:{

 color:COLORS.muted,
 fontSize:12,
 marginBottom:6

},




input:{

 backgroundColor:COLORS.input,
 color:COLORS.text,
 borderRadius:12,
 padding:14,
 borderWidth:1,
 borderColor:COLORS.border

},




passRow:{

 flexDirection:'row',
 gap:8

},



eyeBtn:{

 backgroundColor:COLORS.input,
 borderWidth:1,
 borderColor:COLORS.border,
 borderRadius:12,
 padding:14

},



eyeIcon:{
 fontSize:16
},



forgotRow:{

 alignItems:'flex-end',
 marginBottom:20

},



forgotText:{

 color:COLORS.passenger,
 fontWeight:'600'

},




primaryBtn:{

 backgroundColor:COLORS.passenger,
 borderRadius:14,
 padding:16,
 alignItems:'center',
 marginBottom:20

},




primaryBtnText:{

 color:'#fff',
 fontWeight:'800',
 fontSize:16

},




divider:{

 flexDirection:'row',
 alignItems:'center',
 gap:10,
 marginBottom:16

},



dividerLine:{

 flex:1,
 height:1,
 backgroundColor:COLORS.border

},



dividerText:{

 color:COLORS.muted,
 fontSize:12

},




secondaryBtn:{

 borderWidth:1,
 borderColor:COLORS.border,
 borderRadius:14,
 padding:14,
 alignItems:'center'

},



secondaryBtnText:{

 color:COLORS.text,
 fontWeight:'600'

},




footer:{

 color:COLORS.muted,
 fontSize:11,
 textAlign:'center',
 marginTop:24

}


});