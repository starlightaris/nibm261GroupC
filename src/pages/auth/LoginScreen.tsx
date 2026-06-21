import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';


const { width } = Dimensions.get('window');


type RootStackParamList = {
  Login: undefined;
  DriverHome: undefined;
  PassengerHome: undefined;
  Register: undefined;
};


type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};


const ROLES = [
  {
    id: 'passenger',
    title: 'Passenger',
    icon: '👤',
  },
  {
    id: 'driver',
    title: 'Driver',
    icon: '🚌',
  },
] as const;


export default function LoginScreen({ navigation }: Props) {


  const [role, setRole] =
    useState<'driver' | 'passenger'>('driver');


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);


  const toggleAnim = useRef(
    new Animated.Value(1)
  ).current;


  const pulseAnim = useRef(
    new Animated.Value(1)
  ).current;



  useEffect(() => {

    Animated.loop(

      Animated.sequence([

        Animated.timing(
          pulseAnim,
          {
            toValue: 1.6,
            duration: 900,
            useNativeDriver: true
          }
        ),

        Animated.timing(
          pulseAnim,
          {
            toValue: 1,
            duration: 900,
            useNativeDriver: true
          }
        )

      ])

    ).start();


  }, []);



  const switchRole = (
    value: 'driver' | 'passenger'
  ) => {

    setRole(value);


    Animated.timing(
      toggleAnim,
      {
        toValue: value === 'driver' ? 1 : 0,
        duration: 220,
        useNativeDriver: false
      }
    ).start();

  };



  const pillLeft =
    toggleAnim.interpolate({

      inputRange: [0, 1],

      outputRange: [
        4,
        (width - 48) / 2
      ]

    });



  const handleLogin = async () => {


    if (!email.trim() || !password.trim()) {

      Alert.alert(
        'Error',
        'Enter email and password'
      );

      return;

    }


    try {

      setLoading(true);


      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );


      navigation.replace(
        role === 'driver'
          ? 'DriverHome'
          : 'PassengerHome'
      );


    }
    catch (error: any) {

      Alert.alert(
        'Login Failed',
        error.message
      );

    }
    finally {

      setLoading(false);

    }

  };



  return (

    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >


      <StatusBar style="light" />


      <ScrollView
        bounces={false}
        contentContainerStyle={styles.scroll}
      >



        <View style={styles.mapHero}>


          <View style={styles.mapGrid} />


          <View style={styles.routeLine} />


          {[0.18, 0.48, 0.76].map(
            (x, index) => (

              <View
                key={index}
                style={[
                  styles.routeDot,
                  {
                    left: `${x * 100}%`
                  }
                ]}
              />

            )
          )}



          <Animated.View

            style={[
              styles.pulse,
              {
                transform: [
                  {
                    scale: pulseAnim
                  }
                ]
              }
            ]}

          />



          <Text style={styles.busIcon}>
            🚌
          </Text>


          <View style={styles.cityBar} />


        </View>





        <View style={styles.brandRow}>


          <View style={styles.brand}>


            <View style={styles.brandMark}>

              <Text>
                🚌
              </Text>

            </View>


            <View>

              <Text style={styles.brandName}>

                <Text style={styles.brandOrange}>
                  SMART
                </Text>

                TRANSIT

              </Text>


              <Text style={styles.brandSub}>
                Travel Smarter, Manage Better
              </Text>


            </View>

          </View>




          <View style={styles.liveBadge}>


            <View style={styles.liveDot} />


            <Text style={styles.liveText}>
              LIVE
            </Text>


          </View>


        </View>





        <View style={styles.heroText}>


          <Text style={styles.tagLine}>
            WELCOME BACK
          </Text>


          <Text style={styles.mainTitle}>


            <Text style={styles.mainOrange}>

              {
                role === 'driver'
                  ? 'Driver'
                  : 'Passenger'
              }

            </Text>


            {' Login'}


          </Text>



          <Text style={styles.mainSub}>
            Login to manage your trips
          </Text>


        </View>





        <View style={styles.toggleWrap}>


          <Animated.View
            style={[
              styles.pill,
              {
                left: pillLeft
              }
            ]}
          />



          {
            ROLES.map(item => (

              <TouchableOpacity

                key={item.id}

                style={styles.tabBtn}

                onPress={() => switchRole(item.id)}

              >


                <Text

                  style={[
                    styles.tabTxt,
                    role === item.id &&
                    styles.tabTxtActive
                  ]}

                >


                  {item.icon}{'  '}
                  {item.title}


                </Text>


              </TouchableOpacity>


            ))
          }


        </View>





        <View style={styles.formCard}>


          <View style={styles.fRow}>


            <View style={styles.fIcon}>
              <Text>✉️</Text>
            </View>


            <TextInput

              style={styles.fInput}

              placeholder="Email or Mobile Number"

              placeholderTextColor="#2a4060"

              value={email}

              onChangeText={setEmail}

              keyboardType="email-address"

              autoCapitalize="none"

            />


          </View>



          <View style={styles.fDivider} />



          <View style={styles.fRow}>


            <View style={styles.fIcon}>
              <Text>🔒</Text>
            </View>


            <TextInput

              style={styles.fInput}

              placeholder="Password"

              placeholderTextColor="#2a4060"

              secureTextEntry={!showPwd}

              value={password}

              onChangeText={setPassword}

            />



            <TouchableOpacity
              onPress={() => setShowPwd(!showPwd)}
            >


              <Text style={styles.eyeBtn}>

                {showPwd ? '🙈' : '👁️'}

              </Text>


            </TouchableOpacity>


          </View>


        </View>





        <View style={styles.optRow}>


          <TouchableOpacity
            style={styles.remember}
            onPress={() => setRemember(!remember)}
          >


            <View
              style={[
                styles.chk,
                !remember && styles.chkOff
              ]}
            >


              {
                remember &&
                <Text style={styles.chkMark}>
                  ✓
                </Text>
              }


            </View>



            <Text style={styles.remTxt}>
              Remember Me
            </Text>


          </TouchableOpacity>



          <Text style={styles.forgot}>
            Forgot Password?
          </Text>


        </View>





        <TouchableOpacity

          style={[
            styles.loginBtn,
            loading && { opacity: 0.7 }
          ]}

          onPress={handleLogin}

          disabled={loading}

        >


          {
            loading

              ?

              <ActivityIndicator color="#060d18" />

              :

              <Text style={styles.loginBtnTxt}>
                Login
              </Text>

          }


        </TouchableOpacity>





        <Text
          style={styles.signupTxt}
        >


          Don't have an account?


          <Text

            style={styles.signupLink}

            onPress={() => navigation.navigate('Register')}

          >

            Sign Up

          </Text>


        </Text>



      </ScrollView>


    </KeyboardAvoidingView>


  );

}






const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: '#060d18'
  },


  scroll: {
    flexGrow: 1,
    paddingBottom: 30
  },


  mapHero: {
    height: 180,
    backgroundColor: '#0a1628',
    overflow: 'hidden'
  },


  mapGrid: {
    ...StyleSheet.absoluteFillObject
  },


  routeLine: {
    position: 'absolute',
    top: '50%',
    left: -10,
    right: -10,
    height: 2,
    backgroundColor: '#f5a623',
    transform: [
      {
        rotate: '-8deg'
      }
    ]
  },


  routeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5a623',
    top: '44%'
  },


  pulse: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#f5a623',
    top: '38%',
    left: '45%',
    opacity: .4
  },


  busIcon: {
    position: 'absolute',
    top: '26%',
    left: '42%',
    fontSize: 28
  },


  cityBar: {
    position: 'absolute',
    bottom: 0,
    height: 40,
    left: 0,
    right: 0,
    backgroundColor: '#060d18'
  },


  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  },


  brand: {
    flexDirection: 'row',
    alignItems: 'center'
  },


  brandMark: {
    width: 32,
    height: 32,
    backgroundColor: '#f5a623',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },


  brandName: {
    color: '#fff',
    fontWeight: '800'
  },


  brandOrange: {
    color: '#f5a623'
  },


  brandSub: {
    color: '#4a6a8a',
    fontSize: 10
  },


  liveBadge: {
    flexDirection: 'row',
    backgroundColor: '#0d2a1a',
    padding: 6,
    borderRadius: 20
  },


  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ecc71'
  },


  liveText: {
    color: '#2ecc71',
    fontSize: 10
  },


  heroText: {
    paddingHorizontal: 20
  },


  tagLine: {
    color: '#f5a623'
  },


  mainTitle: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '800'
  },


  mainOrange: {
    color: '#f5a623'
  },


  mainSub: {
    color: '#4a6a8a'
  },


  toggleWrap: {
    margin: 20,
    height: 46,
    flexDirection: 'row',
    backgroundColor: '#0d1f35',
    borderRadius: 50
  },


  pill: {
    position: 'absolute',
    width: '50%',
    top: 4,
    bottom: 4,
    backgroundColor: '#f5a623',
    borderRadius: 50
  },


  tabBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },


  tabTxt: {
    color: '#4a6a8a'
  },


  tabTxtActive: {
    color: '#060d18'
  },


  formCard: {
    margin: 20,
    backgroundColor: '#0d1f35',
    borderRadius: 18
  },


  fRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14
  },


  fIcon: {
    marginRight: 10
  },


  fInput: {
    flex: 1,
    color: '#fff'
  },


  fDivider: {
    height: 1,
    backgroundColor: '#142035'
  },


  eyeBtn: {
    fontSize: 18
  },


  optRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20
  },


  remember: {
    flexDirection: 'row'
  },


  chk: {
    width: 18,
    height: 18,
    backgroundColor: '#f5a623'
  },


  chkOff: {
    backgroundColor: 'transparent',
    borderWidth: 1
  },


  chkMark: {
    color: '#060d18'
  },


  remTxt: {
    color: '#6a8aaa'
  },


  forgot: {
    color: '#f5a623'
  },


  loginBtn: {
    margin: 20,
    backgroundColor: '#f5a623',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center'
  },


  loginBtnTxt: {
    fontWeight: '800'
  },


  signupTxt: {
    textAlign: 'center',
    color: '#4a6a8a'
  },


  signupLink: {
    color: '#f5a623',
    fontWeight: '700'
  }


});