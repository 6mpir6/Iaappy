// A simple in-memory store to replace Vercel KV for development
// This is not persistent across server restarts

type StoreData = {
  [key: string]: any
}

class MemoryStore {
  private store: StoreData = {}
  private lists: { [key: string]: any[] } = {}

  // Set a key-value pair
  async set(key: string, value: any, options?: { ex?: number }): Promise<void> {
    this.store[key] = value

    // If expiration is set, schedule removal
    if (options?.ex) {
      setTimeout(() => {
        delete this.store[key]
      }, options.ex * 1000)
    }
  }

  // Get a value by key
  async get(key: string): Promise<any> {
    return this.store[key] || null
  }

  // Push to a list
  async rpush(key: string, value: any): Promise<void> {
    if (!this.lists[key]) {
      this.lists[key] = []
    }
    this.lists[key].push(value)
  }

  // Get a list range (0, -1 means all items)
  async lrange(key: string, start: number, end: number): Promise<any[]> {
    if (!this.lists[key]) {
      return []
    }

    const list = this.lists[key]
    if (end === -1) {
      end = list.length - 1
    }

    return list.slice(start, end + 1)
  }
}

// Export a singleton instance
export const memoryStore = new MemoryStore()
