import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { listEquipment } from '../api/equipment'
import ErrorMessage from '../components/ErrorMessage'
import LoadingView from '../components/LoadingView'
import StatusBadge from '../components/StatusBadge'
import { colors, font, radius, spacing } from '../theme'

const STATUSES = ['', 'available', 'in_use', 'maintenance', 'retired']

export default function EquipmentListScreen({ navigation }) {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [hasMore, setHasMore]   = useState(false)
  const [q, setQ]               = useState('')
  const [status, setStatus]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]       = useState(null)

  const load = useCallback(async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setLoading(true)
    setError(null)
    try {
      const data = await listEquipment({ q: q || undefined, status: status || undefined, page: pageNum, per_page: 20 })
      setItems((prev) => (reset || pageNum === 1) ? data.items : [...prev, ...data.items])
      setTotal(data.total)
      setPage(pageNum)
      setHasMore(pageNum < data.pages)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }, [q, status])

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
        <TextInput
          style={styles.search}
          placeholder="Search name, asset tag…"
          placeholderTextColor={colors.textMuted}
          value={q}
          onChangeText={(v) => { setQ(v); setPage(1) }}
          returnKeyType="search"
        />
        <View style={styles.pills}>
          {STATUSES.map((s) => (
            <Pressable
              key={s}
              style={[styles.pill, status === s && styles.pillActive]}
              onPress={() => setStatus(s)}
            >
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
            onPress={() => navigation.navigate('EquipmentDetail', { id: item.id, name: item.name })}
          >
            <View style={styles.rowMain}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSub}>{item.asset_tag}{item.location ? ` · ${item.location.name}` : ''}</Text>
            </View>
            <StatusBadge value={item.status} type="equipment" />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={loadingMore ? <Text style={styles.loadMore}>Loading…</Text> : null}
        ListEmptyComponent={<Text style={styles.empty}>No equipment found.</Text>}
        contentContainerStyle={items.length === 0 && styles.emptyContainer}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.background },
  filters:        { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  search:         { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: font.md, color: colors.text, marginBottom: spacing.sm },
  pills:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill:           { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 4 },
  pillActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText:       { fontSize: 12, color: colors.textMuted },
  pillTextActive: { color: '#fff' },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  rowMain:        { flex: 1, marginRight: spacing.md },
  rowTitle:       { fontSize: font.md, fontWeight: '600', color: colors.text },
  rowSub:         { fontSize: font.sm, color: colors.textMuted, marginTop: 2 },
  separator:      { height: 1, backgroundColor: colors.border },
  empty:          { textAlign: 'center', color: colors.textMuted, padding: spacing.xxl },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  loadMore:       { textAlign: 'center', color: colors.textMuted, padding: spacing.lg },
  errorWrap:      { padding: spacing.lg },
})
