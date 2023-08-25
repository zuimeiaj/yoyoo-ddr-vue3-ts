import { BehaviorImplOptions, DDRHooks, ElementRect, TransformProps } from './type'
import {
  getBoundingRect,
  getHandler,
  getPoints,
  getSize,
  handlerPointMap,
  heightMap,
  pointMap,
  pointMap2,
  rad2deg,
  tr2bl,
  widthMap,
} from './util'
export default class BehaviorImpl {
  options: BehaviorImplOptions

  constructor(options: BehaviorImplOptions) {
    this.options = options
  }

  static init(options: BehaviorImplOptions) {
    return new BehaviorImpl(options)
  }
  callHooks(name: DDRHooks, ...params: [MouseEvent & TouchEvent, TransformProps]) {
    this.options.context.emit(name, ...params)
    if (['resize', 'drag', 'rotate'].includes(name)) {
      this.options.context.emit('update:value', params[1])
    }
  }

  setRotateStart(event: MouseEvent & TouchEvent, wrapper: Element) {
    const { clientX, clientY } = event.touches ? event.touches[0] : event
    const { newTransform, localRotateOption } = this.options
    const t = wrapper.getBoundingClientRect()
    const cx = t.left + t.width / 2
    const cy = t.top + t.height / 2
    const startAngle = (180 / Math.PI) * Math.atan2(clientY - cy, clientX - cx)
    const rotation = newTransform.value.rotation
    localRotateOption.value = {
      cx,
      cy,
      startAngle,
      rotation,
    }
  }
  setRotateMove(event: MouseEvent & TouchEvent) {
    const { localRotateOption, newTransform } = this.options
    const { cx, cy, startAngle, rotation } = localRotateOption.value as any
    const { clientX, clientY } = event.touches ? event.touches[0] : event
    const x = clientX - cx
    const y = clientY - cy
    const angle = (180 / Math.PI) * Math.atan2(y, x)
    // 旋转角度 = 鼠标移动时角度 - 鼠标按下时角度
    // 旋转后的角度 = 组件按下时角度 + 旋转角度
    const currentAngle = angle - startAngle
    let r = rotation + currentAngle
    r = r % 360
    r = r < 0 ? r + 360 : r
    const transform = {
      ...newTransform.value,
      rotation: Math.floor(r),
    }

    return this.resetTransform(transform)
  }

  setResizeStart(event: MouseEvent & TouchEvent) {
    const { localPoint, newTransform, props, localResizeOption } = this.options
    const type = localPoint.value.resizeHandler!
    const rect = newTransform.value
    const matrix = getPoints(rect, props.zoom)
    let pressAngle

    const opposite = matrix[pointMap[type]]

    const opp2 = matrix[pointMap2[type]]
    const { clientX, clientY } = event.touches ? event.touches[0] : event

    const handlerPoint = matrix[handlerPointMap[type]]
    const offsetX = clientX - handlerPoint.x
    const offsetY = clientY - handlerPoint.y

    const x1 = clientX - opp2.x - offsetX
    const y1 = clientY - opp2.y - offsetY
    const width = rect.width
    const height = rect.height
    if (tr2bl[type]) {
      pressAngle = rad2deg(Math.atan2(width, widthMap[type] ? height / 2 : height))
    } else {
      pressAngle = rad2deg(Math.atan2(height, heightMap[type] ? width / 2 : width))
    }
    const startAngle = rad2deg(Math.atan2(y1, x1))
    localResizeOption.value = {
      matrix,
      rect,
      type,
      opposite,
      opp2,
      pressAngle,
      startAngle,
      offsetX,
      offsetY,
    }
  }
  setResizeMove(event: MouseEvent & TouchEvent) {
    const { localResizeOption, props, newTransform, isInitialRatio, currentRatio, localTransform } = this.options
    const { clientX, clientY } = event.touches ? event.touches[0] : event
    const { opposite, opp2, type, pressAngle, startAngle, offsetX, offsetY } = localResizeOption.value as any
    const x = clientX - opp2.x - offsetX
    const y = clientY - opp2.y - offsetY
    const dis = Math.hypot(y, x)
    const ratio = event.shiftKey || props.acceptRatio
    const [gridX, gridY] = props.grid

    // 锁定纵横比
    if (!isInitialRatio.value && ratio) {
      currentRatio.value = newTransform.value.width / newTransform.value.height
      isInitialRatio.value = true
    }
    if (!ratio) {
      isInitialRatio.value = false
    }

    // 获取新的宽度和高度
    let { w, h } = getSize({
      type,
      dis,
      x,
      y,
      startAngle,
      pressAngle,
    })
    const transform = { ...localTransform.value }

    // 进行等比例缩放
    if (isInitialRatio.value) {
      if (widthMap[type]) h = w / currentRatio.value
      else w = h * currentRatio.value
    }
    // 还原到实际尺寸
    w /= props.zoom
    h /= props.zoom
    w = Math.min(Math.max(Math.round(w), props.minWidth), props.maxWidth)
    h = Math.min(Math.max(Math.round(h), props.minHeight), props.maxHeight)
    // 判断当前控制点是否为宽度缩放还是高度缩放
    if (widthMap[type] && !ratio) {
      transform.width = w
    } else if (heightMap[type] && !ratio) {
      transform.height = h
    } else {
      transform.width = w
      transform.height = h
    }

    // // 限制在网格中移动，原理同拖动
    if (transform.width % gridX > 0) {
      if (transform.width > localTransform.value.width) {
        // 宽度变大时向下取整
        transform.width = transform.width - (transform.width % gridX)
      } else {
        // 宽度变小时向上取整
        transform.width = transform.width - ((transform.width % gridX) - gridX)
      }
    }

    // 原理同上
    if (transform.height % gridY > 0) {
      if (transform.height > localTransform.value.height) {
        transform.height = transform.height - (transform.height % gridY)
      } else {
        transform.height = transform.height - ((transform.height % gridY) - gridY)
      }
    }

    // 根据新的旋转和宽高计算新的位置
    const matrix = getPoints(transform, props.zoom)

    const newOpposite = matrix[pointMap[type]]
    const deltaX = -(newOpposite.x - opposite.x) / props.zoom
    const deltaY = -(newOpposite.y - opposite.y) / props.zoom

    transform.x = Math.round(transform.x + deltaX)
    transform.y = Math.round(transform.y + deltaY)

    return this.resetTransform(transform)
  }

  setDragMove() {
    const { props, localPoint, newTransform, localTransform } = this.options
    const [gridX, gridY] = props.grid
    const deltaX = localPoint.value.deltaX / props.zoom
    const deltaY = localPoint.value.deltaY / props.zoom
    const x = (localTransform.value.x = Math.round(localTransform.value.x + deltaX))
    const y = (localTransform.value.y = Math.round(localTransform.value.y + deltaY))
    const transform = { ...newTransform.value }

    // 将当前位置对齐网格，限制在父元素内进行移动
    // 当deltaX > 0 说明当前移动方向为向右移动，则向下取整。例如：10 12 14 始终取 10
    // 当deltaY < 0 说明当干移动方向为向左移动，则向上取整。例如：20 19 17 始终取 20
    if (props.axis.includes('x')) {
      if (x > transform.x) {
        transform.x = x - (x % gridX)
      } else if (x < transform.x) {
        transform.x = x - ((x % gridX) - gridX)
      }
    }

    if (props.axis.includes('y')) {
      if (y > transform.y) {
        transform.y = y - (y % gridY)
      } else if (y < transform.y) {
        transform.y = y - ((y % gridY) - gridY)
      }
    }

    return this.resetTranslate(transform)
  }
  resetTranslate(transform: TransformProps) {
    const {
      props,
      localPoint: { value: current },
    } = this.options
    if (!props.parent) {
      return transform
    }
    const rect = getBoundingRect(transform, props.zoom)
    let diffX = 0
    let diffY = 0
    if (rect.left < 0) {
      diffX = rect.left
    }
    if (rect.right > current.parentRect.width) {
      diffX = rect.right - current.parentRect.width
    }
    if (rect.top < 0) {
      diffY = rect.top
    }
    if (rect.bottom > current.parentRect.height) {
      diffY = rect.bottom - current.parentRect.height
    }
    transform.x -= diffX
    transform.y -= diffY
    return transform
  }
  resetTransform(transform: TransformProps) {
    const { props, localLastTransform } = this.options
    // 限制在父元素中
    const rect = getBoundingRect(transform, props.zoom)
    const flag = this.allowTransform(rect)
    if (flag) {
      localLastTransform.value = transform
    } else {
      transform = localLastTransform.value
    }
    return transform
  }
  handleDefaultEvent(e: MouseEvent & TouchEvent) {
    const { props } = this.options
    if (props.stop) {
      e.stopPropagation()
    }
    if (props.prevent) {
      e.preventDefault()
    }
  }
  // 缩放和旋转只进行判断，不会以边界进行修正transform，如果缩放过快顶点可能无法触碰到边界就会停止动作
  allowTransform(rect: ElementRect) {
    const { props, localPoint } = this.options
    if (!props.parent) return true
    return (
      rect.left >= 0 &&
      rect.right <= localPoint.value.parentRect.width &&
      rect.top >= 0 &&
      rect.bottom <= localPoint.value.parentRect.height
    )
  }
  getNewHandler(type: string) {
    const { newTransform, props: ddrProps } = this.options
    const cursor = getHandler(type, newTransform.value.rotation)
    const { handlerSize } = ddrProps
    let props = {} as any
    const half = -Math.floor(handlerSize / 2)
    switch (type) {
      case 'tl':
        props = {
          top: half,
          left: half,
        }
        break
      case 'tm':
        props = { top: half, marginLeft: half }
        break
      case 'tr':
        props = { right: half, top: half }
        break
      case 'r':
        props = { right: half, marginTop: half }
        break
      case 'br':
        props = { bottom: half, right: half }
        break
      case 'bm':
        props = { marginLeft: half, bottom: half }
        break
      case 'bl':
        props = { left: half, bottom: half }
        break
      case 'l':
        props = { marginTop: half, left: half }
        break
    }
    Object.keys(props).forEach((key) => {
      props[key] += 'px'
    })
    const result = {
      cursor: cursor + '-resize',
      width: Math.ceil(handlerSize / ddrProps.zoom) + 'px',
      height: Math.ceil(handlerSize / ddrProps.zoom) + 'px',
      ...props,
    }
    return result
  }

  getNewStyle(transform: TransformProps) {
    return {
      left: transform.x + 'px',
      top: transform.y + 'px',
      width: transform.width + 'px',
      height: transform.height + 'px',
      transform: `rotate(${transform.rotation}deg)`,
    }
  }

  getRotateHandler() {
    const { props } = this.options
    const size = Math.ceil(props.handlerSize / props.zoom) + 'px'
    return { width: size, height: size, top: '-25px', marginLeft: -Math.floor(props.handlerSize / 2) + 'px' }
  }
  getClassNames() {
    const {
      props,
      localPoint: { value: current },
    } = this.options
    const ddrClassNames = ['yoyoo-ddr']
    if (props.active) ddrClassNames.push('active')
    if (current.isDragging) ddrClassNames.push('ddr-dragging')
    if (current.isResizing) ddrClassNames.push('ddr-resizing')
    if (current.isRotating) ddrClassNames.push('ddr-rotating')
    if (current.isReadyToDrag) ddrClassNames.push('ddr-ready-drag')
    if (current.isReadyToResize) ddrClassNames.push('ddr-ready-resize')
    if (current.isReadyToRotate) ddrClassNames.push('ddr-ready-rotate')
    return ddrClassNames.join(' ')
  }
  setMoveHandler(event: MouseEvent & TouchEvent) {
    this.handleDefaultEvent(event)
    const {
      localPoint: { value: current },
      props,
      newTransform,
    } = this.options
    const { clientX, clientY } = event.touches ? event.touches[0] : event
    current.isReadyToDrag = false
    current.isReadyToResize = false
    current.isReadyToRotate = false
    current.deltaX = clientX - current.lastX
    current.deltaY = clientY - current.lastY
    current.lastX = clientX
    current.lastY = clientY

    let transform: TransformProps | null = null

    if (current.handlerType === 'resize') {
      current.isResizing = true
      transform = this.setResizeMove(event)
      newTransform.value = transform
      this.callHooks('resize', event, transform)
    } else if (current.handlerType === 'drag' && props.draggable) {
      current.isDragging = true
      transform = this.setDragMove()
      newTransform.value = transform
      this.callHooks('drag', event, transform)
    } else if (current.handlerType === 'rotate') {
      current.isRotating = true
      transform = this.setRotateMove(event)
      newTransform.value = transform
      this.callHooks('rotate', event, transform)
    }

    if (transform !== null) {
      this.callHooks('change', event, transform)
    }
  }
}
