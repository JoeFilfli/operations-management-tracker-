import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getEquipment, updateEquipment } from '../api/equipment'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import LoadingView from '../components/LoadingView'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { colors, font, radius, spacing } from '../theme'

const STATUSES = ['available', 'in_use', 'maintenance', 'retired']

export default function EquipmentDetailScreen({ route, navigation }) {
  const { id } = route.params
  const { user } = useAuth()
  const canWrite = ['admin', 'staff'].includes(user?.role)

  const [eq, setEq]             = useState(null)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    getEquipment(id).then((d) => { setEq(d); navigation.setOptions({ title: d.name }) }).catch(setError)
  }, [id])

  const handleStatusChange = (newStatus) => {
    if (!canWrite) return
    Alert.alert('Change Status', `Set status to "${newStatus.replace(/_/g, ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setSaveError(null); setSaving(true)
          try { setEq(await updateEquipment(id, { status: newStatus })) }
          catch (err) { setSaveError(err) }
          finally { setSaving(false) }
        },
      },
    ])
  }

  if (error) return <View style={styles.errorWrap}><ErrorMessage error={error} /></View>
  if (!eq) return <LoadingView />

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saveError && <ErrorMessage error={saveError} />}

      <Card>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>{eq.name}</Text>
            <Text style={styles.tag}>{eq.asset_tag}</Text>
          </View>
          <StatusBadge value={eq.status} type="equipment" />
        </View>
      </Card>

      <Card>
        {[
          ['Location',      eq.location?.name || '—'],
          ['Manufacturer',  eq.manufacturer || '—'],
          ['Model',         eq.model || '—'],
          ['Serial Number', eq.serial_number || '—'],
        ].map(([label, val]) => (
          <View key={label} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{val}</Text>
          </View>
        ))}
        {eq.description ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <Text style={styles.fieldValue}>{eq.description}</Text>
          </View>
        ) : null}
      </Card>

      {canWrite && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[styles.statusBtn, eq.status === s && styles.statusBtnActive, saving && styles.statusBtnDisabled]}
                onPress={() => handleStatusChange(s)}
                disabled={saving || eq.status === s}
              >
                <Text style={[styles.statusBtnText, eq.status === s && styles.statusBtnTextActive]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  content:            { padding: spacing.lg },
  headerRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft:         { flex: 1, marginRight: spacing.md },
  name:               { fontSize: font.xl, fontWeight: '700', color: colors.text },
  tag:                { fontSize: font.sm, color: colors.textMuted, marginTop: 4 },
  field:              { marginBottom: spacing.md },
  fieldLabel:         { fontSize: font.sm, color: colors.textMuted, marginBottom: 2 },
  fieldValue:         { fontSize: font.md, color: colors.text, fontWeight: '500' },
  sectionTitle:       { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  statusSection:      { marginTop: spacing.xs },
  statusGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  statusBtnActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  statusBtnDisabled:  { opacity: 0.5 },
  statusBtnText:      { fontSize: font.sm, color: colors.text, textTransform: 'capitalize' },
  statusBtnTextActive:{ color: '#fff' },
  errorWrap:          { padding: spacing.lg },
})
