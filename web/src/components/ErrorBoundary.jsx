import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50">
        <span className="text-5xl mb-4" aria-hidden="true">⚠️</span>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-md">
          An unexpected error occurred. Try refreshing the page — if the problem persists, contact your administrator.
        </p>
        <div className="flex gap-3">
          <button
            className="btn-primary"
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
          >
            Reload page
          </button>
          <Link to="/" className="btn-secondary" onClick={() => this.setState({ error: null })}>
            Go to dashboard
          </Link>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-8 text-left text-xs bg-red-50 border border-red-200 text-red-800 p-4 rounded max-w-2xl overflow-auto">
            {this.state.error.message}
            {'\n'}
            {this.state.error.stack}
          </pre>
        )}
      </div>
    )
  }
}
