import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { login } from '../api/auth'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../context/AuthContext'
import { colors, font, radius, spacing } from '../theme'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleLogin = async () => {
    if (!email || !password) return
    setError(null)
    setLoading(true)
    try {
      const data = await login(email.trim().toLowerCase(), password)
      await signIn({ access_token: data.access_token, refresh_token: data.refresh_token }, data.user)
    } catch (err) {
      setError(
        err.response?.data?.error === 'invalid_credentials'
          ? { message: 'Invalid email or password.' }
          : err,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>O</Text>
          </View>
          <Text style={styles.title}>OpsTrack</Text>
          <Text style={styles.subtitle}>Equipment & Operations Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <ErrorMessage error={error} />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sign in</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { color: '#fff', fontSize: font.xl, fontWeight: '700' },
  title: { fontSize: font.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  cardTitle: { fontSize: font.lg, fontWeight: '600', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: font.sm, fontWeight: '500', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: font.md,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: font.md, fontWeight: '600' },
})
