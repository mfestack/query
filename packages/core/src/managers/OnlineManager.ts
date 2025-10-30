// OnlineManager - Manages online/offline state
export class OnlineManager {
  private isOnline = true
  private listeners = new Set<(isOnline: boolean) => void>()

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    const onOnline = () => {
      this.isOnline = true
      this.notifyListeners()
    }

    const onOffline = () => {
      this.isOnline = false
      this.notifyListeners()
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    // Cleanup function
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getOnlineStatus() {
    return this.isOnline
  }
}

export const onlineManager = new OnlineManager()
