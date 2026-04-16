export default function ErrorMessage({ error }) {
  if (!error) return null
  const msg = error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || 'An unexpected error occurred.'
  return (
    <div role="alert" aria-live="assertive" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
      {msg}
    </div>
  )
}
