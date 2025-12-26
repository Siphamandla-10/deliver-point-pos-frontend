import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.mainContainer}>
        {/* Left Side - Icon with Pink/Purple Gradient */}
        <LinearGradient
          colors={['#BA68C8', '#AB47BC', '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.leftSection}
        >
          <View style={styles.illustrationContainer}>
            <View style={styles.iconWrapper}>
              <Image 
                source={require('../assets/icon.png')} 
                style={styles.iconImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.illustrationText}>Deliver Point</Text>
            <Text style={styles.illustrationSubtext}>Modern POS Solution</Text>
          </View>
        </LinearGradient>

        {/* Right Side - Login Form with Light Pink BG */}
        <View style={styles.rightSection}>
          {/* Login Form */}
          <View style={styles.loginForm}>
            <Text style={styles.loginTitle}>Login</Text>

            {/* Login Icon - Human Face - Closer to form */}
            <View style={styles.loginIconContainer}>
              <View style={styles.loginIconCircle}>
                <Ionicons name="person" size={50} color="#9C27B0" />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Keep me logged in */}
            <View style={styles.keepLoggedInContainer}>
              <Text style={styles.keepLoggedInText}>Keep me logged in</Text>
              <Switch
                value={keepLoggedIn}
                onValueChange={setKeepLoggedIn}
                trackColor={{ false: '#DDD', true: '#9C27B0' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log in</Text>
              )}
            </TouchableOpacity>

            {/* TouchID / FaceID */}
            <TouchableOpacity style={styles.biometricButton}>
              <Ionicons name="finger-print-outline" size={28} color="#9C27B0" />
              <Text style={styles.biometricText}>Login With TouchId</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  leftSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  illustrationContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 180,
    height: 180,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  iconImage: {
    width: 130,
    height: 130,
  },
  illustrationText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  illustrationSubtext: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  rightSection: {
    flex: 1,
    backgroundColor: '#F3E5F5',
    padding: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginForm: {
    width: '100%',
    maxWidth: 400,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6A1B9A',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginIconContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  loginIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E1BEE7',
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#6A1B9A',
  },
  eyeIcon: {
    padding: 5,
  },
  keepLoggedInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    marginTop: 5,
  },
  keepLoggedInText: {
    fontSize: 14,
    color: '#7B1FA2',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#9C27B0',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#9C27B0',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  biometricButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  biometricText: {
    fontSize: 13,
    color: '#9C27B0',
    fontWeight: '500',
  },
});

export default LoginScreen;