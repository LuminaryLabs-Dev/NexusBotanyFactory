'use client'

import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch() {
    // React error boundary hook for render-time failures.
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({
        hasError: false,
        error: null,
      })
    }
  }

  render() {
    if (this.state.hasError) {
      if (typeof this.props.renderFallback === 'function') {
        return this.props.renderFallback({
          error: this.state.error,
          reset: () => {
            this.setState({
              hasError: false,
              error: null,
            })
          },
        })
      }

      return null
    }

    return this.props.children
  }
}
