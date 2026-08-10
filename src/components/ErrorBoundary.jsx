import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[12rem] flex-col items-center justify-center gap-4 rounded-xl bg-red-50 p-6 text-center dark:bg-red-950/30">
          <p className="text-lg font-semibold text-red-800 dark:text-red-200">
            Algo salió mal en este componente
          </p>
          <p className="max-w-md text-sm text-red-700/80 dark:text-red-300/80">
            {this.state.error?.message || 'Error inesperado'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="rounded-full bg-[#D48C70] px-5 py-2.5 text-sm font-semibold text-white active:scale-[0.98] dark:bg-[#8C4A32]"
          >
            Reintentar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
