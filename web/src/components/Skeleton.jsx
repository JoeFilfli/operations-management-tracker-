export function SkeletonBlock({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-gray-200 rounded ${className}`}
    />
  )
}

export function SkeletonStatCard() {
  return (
    <div className="card p-5" aria-hidden="true">
      <SkeletonBlock className="h-3 w-20 mb-3" />
      <SkeletonBlock className="h-8 w-12" />
    </div>
  )
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className="h-3 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  )
}
