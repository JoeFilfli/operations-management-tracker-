import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { listTickets } from '../api/tickets'
import ErrorMessage from '../components/ErrorMessage'
import LoadingView from '../components/LoadingView'
import StatusBadge from '../components/StatusBadge'
import { colors, font, radius, spacing } from '../theme'

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed']

export default function TicketListScreen({ navigation }) {
  const [items, setItems]       = useState([])
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(false)
  const [status, setStatus]     = useState('')
  const [mine, setMine]         = useState(true)
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]       = useState(null)

  const load = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoading(true)
    setError(null)
    try {
      const data = await listTickets({ status: status || undefined, mine: mine || undefined, page: pageNum, per_page: 20 })
      setItems((prev) => (reset || pageNum === 1) ? data.items : [...prev, ...data.items])
      setPage(pageNum)
      setHasMore(pageNum < data.pages)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [status, mine])

  useEffect(() => { load(1, true) }, [load])

  const onRefresh = () => { setRefreshing(true); load(1, true) }
  const onEndReached = () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    load(page + 1)
  }

  if (loading && !refreshing) return <LoadingView />

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <View style={styles.mineRow}>
          <Text style={styles.mineLabel}>My tickets only</Text>
          <Switch
            value={mine}
            onValueChange={(v) => setMine(v)}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.pills}>
          {STATUSES.map((s) => (
            <Pressable key={s} style={[styles.pill, status === s && styles.pillActive]} onPress={() => setStatus(s)}>
              <Text style={[styles.pillText, status === s && styles.pillTextActive]}>
                {s ? s.replace(/_/g, ' ') : 'All'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error && <View style={styles.errorWrap}><ErrorMessage error={error} /></View>}

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('TicketDetail', { id: item.id })}
          >
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.equipment?.name ?? '—'}</Text>
              <View style={styles.badges}>
                <StatusBadge value={item.status} type="ticket" />
                <View style={{ width: 6 }} />
                <StatusBadge value={item.priority} type="priority" />
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <Text style={styles.loadMore}>Loading…</Text> : null}
        ListEmptyComponent={<Text style={styles.empty}>No tickets found.</Text>}
        contentContainerStyle={items.length === 0 && styles.emptyContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  filters:        { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
  mineRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  mineLabel:      { fontSize: font.md, color: colors.text },
  pills:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill:           { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 4 },
  pillActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText:       { fontSize: 12, color: colors.textMuted },
  pillTextActive: { color: '#fff' },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  rowMain:        { flex: 1 },
  rowTitle:       { fontSize: font.md, fontWeight: '600', color: colors.text, marginBottom: 3 },
  rowSub:         { fontSize: font.sm, color: colors.textMuted, marginBottom: 6 },
  badges:         { flexDirection: 'row' },
  chevron:        { fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
  separator:      { height: 1, backgroundColor: colors.border },
  empty:          { textAlign: 'center', color: colors.textMuted, padding: spacing.xxl },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  loadMore:       { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
  errorWrap:      { padding: spacing.lg },
})
