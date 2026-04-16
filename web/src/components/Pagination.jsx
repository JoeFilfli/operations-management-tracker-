export default function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between px-1 py-2 text-sm text-gray-600">
      <span>{total} result{total !== 1 ? 's' : ''}</span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="btn-secondary px-2 py-1 disabled:opacity-40"
        >
          ‹ Prev
        </button>
        <span className="px-2 py-1 text-gray-500">
          {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="btn-secondary px-2 py-1 disabled:opacity-40"
        >
          Next ›
        </button>
      </div>
    </div>
  )
}
