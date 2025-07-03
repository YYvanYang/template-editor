/**
 * LRU (Least Recently Used) Cache Implementation
 * 
 * High-performance cache with O(1) get/set operations
 */

interface LRUNode<K, V> {
  key: K
  value: V
  prev: LRUNode<K, V> | null
  next: LRUNode<K, V> | null
}

export interface LRUCacheConfig<K, V> {
  max: number
  dispose?: (key: K, value: V) => void
  updateAgeOnGet?: boolean
}

export class LRUCache<K, V> {
  private map: Map<K, LRUNode<K, V>>
  private head: LRUNode<K, V> | null = null
  private tail: LRUNode<K, V> | null = null
  private config: LRUCacheConfig<K, V>

  constructor(config: LRUCacheConfig<K, V>) {
    this.config = {
      updateAgeOnGet: true,
      ...config,
    }
    this.map = new Map()
  }

  get size(): number {
    return this.map.size
  }

  get(key: K): V | undefined {
    const node = this.map.get(key)
    if (!node) return undefined

    if (this.config.updateAgeOnGet) {
      this.moveToHead(node)
    }

    return node.value
  }

  set(key: K, value: V): void {
    const existing = this.map.get(key)

    if (existing) {
      existing.value = value
      this.moveToHead(existing)
      return
    }

    const node: LRUNode<K, V> = {
      key,
      value,
      prev: null,
      next: null,
    }

    this.map.set(key, node)
    this.addToHead(node)

    if (this.map.size > this.config.max) {
      this.removeTail()
    }
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  delete(key: K): boolean {
    const node = this.map.get(key)
    if (!node) return false

    this.removeNode(node)
    this.map.delete(key)

    if (this.config.dispose) {
      this.config.dispose(key, node.value)
    }

    return true
  }

  clear(): void {
    if (this.config.dispose) {
      this.map.forEach((node, key) => {
        this.config.dispose!(key, node.value)
      })
    }

    this.map.clear()
    this.head = null
    this.tail = null
  }

  forEach(callback: (key: K, value: V) => void): void {
    let current = this.head
    while (current) {
      callback(current.key, current.value)
      current = current.next
    }
  }

  removeOldest(): [K, V] | undefined {
    if (!this.tail) return undefined

    const key = this.tail.key
    const value = this.tail.value
    this.delete(key)

    return [key, value]
  }

  private addToHead(node: LRUNode<K, V>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  private removeNode(node: LRUNode<K, V>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  private moveToHead(node: LRUNode<K, V>): void {
    if (node === this.head) return

    this.removeNode(node)
    this.addToHead(node)
  }

  private removeTail(): void {
    if (!this.tail) return

    const key = this.tail.key
    const value = this.tail.value

    this.removeNode(this.tail)
    this.map.delete(key)

    if (this.config.dispose) {
      this.config.dispose(key, value)
    }
  }
}