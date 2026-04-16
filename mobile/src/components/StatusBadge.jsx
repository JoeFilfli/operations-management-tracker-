import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme'

export default function StatusBadge({ value, type = 'equipment' }) {
  const map = {
    equipment: colors.statusEquipment,
    ticket:    colors.statusTicket,
    priority:  colors.priority,
  }
  const scheme = (map[type] ?? {})[value] ?? { bg: '#f3f4f6', text: '#6b7280' }
  const label = value?.replace(/_/g, ' ') ?? '—'
  return (
    <View style={[styles.badge, { backgroundColor: scheme.bg }]}>
      <Text style={[styles.label, { color: scheme.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
})
