export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface ElementStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderRadius?: number
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }
}

export interface BaseElementData {
  id: string
  type: string
  name: string
  position: Position
  size: Size
  rotation?: number
  visible?: boolean
  locked?: boolean
  style?: ElementStyle
  zIndex?: number
  groupId?: string
  data?: Record<string, unknown>
}

export abstract class BaseElement<T extends BaseElementData = BaseElementData> {
  protected _data: T

  constructor(data: T) {
    this._data = { ...data }
  }

  get id(): string {
    return this._data.id
  }

  get type(): string {
    return this._data.type
  }

  get name(): string {
    return this._data.name
  }

  set name(value: string) {
    this._data.name = value
  }

  get position(): Position {
    return { ...this._data.position }
  }

  set position(value: Position) {
    this._data.position = { ...value }
  }

  get size(): Size {
    return { ...this._data.size }
  }

  set size(value: Size) {
    this._data.size = { ...value }
  }

  get rotation(): number {
    return this._data.rotation ?? 0
  }

  set rotation(value: number) {
    this._data.rotation = value
  }

  get visible(): boolean {
    return this._data.visible ?? true
  }

  set visible(value: boolean) {
    this._data.visible = value
  }

  get locked(): boolean {
    return this._data.locked ?? false
  }

  set locked(value: boolean) {
    this._data.locked = value
  }

  get style(): ElementStyle {
    return { ...this._data.style }
  }

  set style(value: ElementStyle) {
    this._data.style = { ...value }
  }

  get zIndex(): number {
    return this._data.zIndex ?? 0
  }

  set zIndex(value: number) {
    this._data.zIndex = value
  }

  get groupId(): string | undefined {
    return this._data.groupId
  }

  set groupId(value: string | undefined) {
    this._data.groupId = value
  }

  get data(): Record<string, unknown> {
    return { ...this._data.data }
  }

  // Methods
  move(deltaX: number, deltaY: number): void {
    this._data.position.x += deltaX
    this._data.position.y += deltaY
  }

  moveTo(x: number, y: number): void {
    this._data.position.x = x
    this._data.position.y = y
  }

  resize(width: number, height: number): void {
    this._data.size.width = width
    this._data.size.height = height
  }

  rotate(angle: number): void {
    this._data.rotation = (this._data.rotation ?? 0) + angle
  }

  rotateTo(angle: number): void {
    this._data.rotation = angle
  }

  clone(): T {
    return {
      ...this._data,
      id: `${this._data.id}_copy_${Date.now()}`,
      position: { ...this._data.position },
      size: { ...this._data.size },
      style: this._data.style ? { ...this._data.style } : undefined,
      data: this._data.data ? { ...this._data.data } : undefined,
    }
  }

  toJSON(): T {
    return { ...this._data }
  }

  // Abstract methods to be implemented by subclasses
  abstract render(): React.ReactNode
  abstract getBoundingBox(): { x: number; y: number; width: number; height: number }
  abstract containsPoint(x: number, y: number): boolean
}