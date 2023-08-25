import { DDRProps, LocalPointProps, LocalResizeProps, LocalRotateProps, TransformProps } from './type'
import BehaviorImpl from './behavior-impl'
import { getDefaultProps } from './defaults'
import { ComponentInternalInstance, ref, watch } from 'vue'

export function useDDRBehavior(initProps: Partial<DDRProps>, context: ComponentInternalInstance) {
  const props = getDefaultProps(initProps)
  const newTransform = ref<TransformProps>(props.value)
  const isInitialRatio = ref(false)
  const currentRatio = ref(1)
  const localRotateOption = ref({} as LocalRotateProps)
  const localResizeOption = ref({} as LocalResizeProps)
  const localPoint = ref({} as LocalPointProps)
  const localLastTransform = ref<TransformProps>({ ...newTransform.value })
  const localTransform = ref<TransformProps>({ ...newTransform.value })
  const domWrapper = ref<HTMLDivElement>()
  // 对辅具体实现进行初始化
  const behaviorImpl = BehaviorImpl.init({
    context,
    newTransform,
    localLastTransform,
    localTransform,
    localPoint,
    currentRatio,
    isInitialRatio,
    localResizeOption,
    localRotateOption,
    props,
  })

  watch(props.value, (value) => (newTransform.value = value))

  return {
    behavior: behaviorImpl,
    transform: newTransform,
    domWrapper,
    // 准备就绪
    setMouseDownHandler: (event: MouseEvent & TouchEvent) => {
      if (!props.active && !props.beforeActive()) return
      behaviorImpl.handleDefaultEvent(event)
      const point = event.touches ? event.touches[0] : event
      const target = event.target as HTMLElement
      const { clientX, clientY } = point
      // 缓存当前鼠标位置相关信息和点击的元素信息
      localPoint.value.lastX = clientX
      localPoint.value.lastY = clientY
      localPoint.value.activeTarget = target
      localPoint.value.parentRect = domWrapper.value!.parentElement!.getBoundingClientRect()
      localPoint.value.resizeHandler = target.dataset.resizetype as string
      localTransform.value = { ...newTransform.value }
      localLastTransform.value = { ...newTransform.value }

      const moveHandler = (event: any) => {
        behaviorImpl.setMoveHandler(event)
      }
      const upHandler = (e: any) => {
        behaviorImpl.handleDefaultEvent(e)
        document.removeEventListener('mousemove', moveHandler, false)
        document.removeEventListener('mouseup', moveHandler, false)
        document.removeEventListener('mouseup', upHandler, false)
        document.removeEventListener('touchend', upHandler, false)
        const current = localPoint.value
        current.isDragging = current.isResizing = current.isRotating = false
        current.isReadyToDrag = current.isReadyToResize = current.isReadyToRotate = false
        // emit hooks
        if (current.handlerType == 'resize') {
          behaviorImpl.callHooks('resizeend', event, newTransform.value)
        } else if (current.handlerType == 'rotate') {
          behaviorImpl.callHooks('rotateend', event, newTransform.value)
        } else if (current.handlerType == 'drag') {
          behaviorImpl.callHooks('dragend', event, newTransform.value)
        }
      }

      document.addEventListener('mousemove', moveHandler, false)
      document.addEventListener('touchmove', moveHandler, false)
      document.addEventListener('touchend', upHandler, false)
      document.addEventListener('mouseup', upHandler, false)

      const type = (event.target as HTMLElement).dataset.type
      const transform = { ...newTransform.value }
      if (type === 'rotate') {
        localPoint.value.handlerType = 'rotate'
        localPoint.value.isReadyToRotate = true
        behaviorImpl.setRotateStart(event, domWrapper.value!)
        behaviorImpl.callHooks('rotatestart', event, transform)
      } else if (target.dataset.resizetype) {
        localPoint.value.handlerType = 'resize'
        localPoint.value.isReadyToResize = true
        behaviorImpl.setResizeStart(event)
        behaviorImpl.callHooks('resizestart', event, transform)
      } else {
        localPoint.value.handlerType = 'drag'
        localPoint.value.isReadyToDrag = true
        props.draggable && behaviorImpl.callHooks('dragstart', event, transform)
      }
    },
  }
}
