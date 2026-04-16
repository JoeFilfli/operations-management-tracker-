import { useEffect, useState } from 'react'
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { getTicket, updateTicket } from '../api/tickets'
import Card from '../components/Card'
import ErrorMessage from '../components/ErrorMessage'
import LoadingView from '../components/LoadingView'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { colors, font, radius, spacing } from '../theme'

const STATUSES = ['open', 'in_progress', 'resolved', 'closed']

export default function TicketDetailScreen({ route, navigation }) {
  const { id } = route.params
  const { user } = useAuth()

  const [ticket, setTicket]     = useState(null)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveError, setSaveError] = useState(null)

  const canModify = () => {
    if (!ticket || !user) return false
    if (['admin', 'staff'].includes(user.role)) return true
    if (ticket.reporter_id === user.id) return true
    return ticket.assignments.some((a) => a.user_id === user.id)
  }

  useEffect(() => {
    getTicket(id).then((d) => { setTicket(d); navigation.setOptions({ title: `#${d.id} ${d.title.slice(0, 30)}` }) }).catch(setError)
  }, [id])

  const handleStatusChange = (newStatus) => {
    if (!canModify()) return
    Alert.alert('Update Status', `Change to "${newStatus.replace(/_/g, ' ')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setSaveError(null); setSaving(true)
          try { setTicket(await updateTicket(id, { status: newStatus })) }
          catch (err) { setSaveError(err) }
          finally { setSaving(false) }
        },
      },
    ])
  }

  if (error) return <View style={styles.errorWrap}><ErrorMessage error={error} /></View>
  if (!ticket) return <LoadingView />

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {saveError && <ErrorMessage error={saveError} />}

      <Card>
        <Text style={styles.title}>{ticket.title}</Text>
        <View style={styles.badges}>
          <StatusBadge value={ticket.status} type="ticket" />
          <View style={{ width: 8 }} />
          <StatusBadge value={ticket.priority} type="priority" />
        </View>
        {ticket.description ? <Text style={styles.description}>{ticket.description}</Text> : null}
      </Card>

      <Card>
        {[
          ['Equipment', ticket.equipment ? `${ticket.equipment.name} (${ticket.equipment.asset_tag})` : '—'],
          ['Reporter',  ticket.reporter?.full_name || '—'],
          ['Resolved',  ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : '—'],
        ].map(([label, val]) => (
          <View key={label} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <Text style={styles.fieldValue}>{val}</Text>
          </View>
        ))}
      </Card>

      {ticket.assignments.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Assignees</Text>
          {ticket.assignments.map((a) => (
            <Text key={a.id} style={styles.assignee}>
              {a.user?.full_name} <Text style={styles.assigneeEmail}>({a.user?.email})</Text>
            </Text>
          ))}
        </Card>
      )}

      {canModify() && (
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>Update Status</Text>
          <View style={styles.statusGrid}>
            {STATUSES.map((s) => (
              <Pressable
                key={s}
                style={[styles.statusBtn, ticket.status === s && styles.statusBtnActive, saving && styles.statusBtnDisabled]}
                onPress={() => handleStatusChange(s)}
                disabled={saving || ticket.status === s}
              >
                <Text style={[styles.statusBtnText, ticket.status === s && styles.statusBtnTextActive]}>
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
  title:              { fontSize: font.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  badges:             { flexDirection: 'row', marginBottom: spacing.sm },
  description:        { fontSize: font.md, color: colors.text, marginTop: spacing.sm, lineHeight: 22 },
  field:              { marginBottom: spacing.md },
  fieldLabel:         { fontSize: font.sm, color: colors.textMuted, marginBottom: 2 },
  fieldValue:         { fontSize: font.md, color: colors.text, fontWeight: '500' },
  sectionTitle:       { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  assignee:           { fontSize: font.md, color: colors.text, marginBottom: 4 },
  assigneeEmail:      { color: colors.textMuted, fontSize: font.sm },
  statusSection:      { marginTop: spacing.xs },
  statusGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusBtn:          { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surface },
  statusBtnActive:    { backgroundColor: colors.primary, borderColor: colors.primary },
  statusBtnDisabled:  { opacity: 0.5 },
  statusBtnText:      { fontSize: font.sm, color: colors.text, textTransform: 'capitalize' },
  statusBtnTextActive:{ color: '#fff' },
  errorWrap:          { padding: spacing.lg },
})
