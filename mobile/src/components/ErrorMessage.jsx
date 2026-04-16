import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export default function ErrorMessage({ error }) {
  if (!error) return null
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'An unexpected error occurred.'
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{msg}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  text: { color: colors.error, fontSize: 13 },
})
