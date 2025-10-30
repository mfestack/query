// FocusManager - Manages window focus events for refetching
export class FocusManager {
  private isFocused = true
  private listeners = new Set<(isFocused: boolean) => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    const onFocus = () => {
      this.isFocused = true
      this.notifyListeners()
    }

    const onBlur = () => {
      this.isFocused = false
      this.notifyListeners()
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)

    // Cleanup function
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isFocused))
  }

  subscribe(listener: (isFocused: boolean) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  isFocusedFn() {
    return this.isFocused
  }
}

export const focusManager = new FocusManager()
