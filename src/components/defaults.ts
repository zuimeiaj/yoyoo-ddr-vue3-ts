import { DDRPropKey, DDRProps } from './type'
const defaults = () => ({
  value: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
  handlerSize: 11,
  active: true,
  resizeHandler: ['tl', 'tm', 'tr', 'r', 'br', 'bm', 'bl', 'l'],
  resizable: true,
  rotatable: true,
  draggable: true,
  acceptRatio: false,
  minWidth: 1,
  minHeight: 1,
  maxWidth: 1000000,
  maxHeight: 1000000,
  parent: false,
  grid: [1, 1],
  stop: true,
  prevent: true,
  zoom: 1,
  axis: 'xy',
  beforeActive: () => false,
})
export function getDefaultProps(props: Partial<DDRProps>) {
  return { ...defaults(), ...props } as DDRProps
}

export function getDDRProps() {
  const props = defaults() as DDRProps
  const newProps: Record<string, any> = {}
  const keys = Object.keys(props) as DDRPropKey[]

  keys.forEach((item) => {
    if (Array.isArray(props[item])) {
      newProps[item] = {
        type: Array,
        default: () => props[item],
      }
    } else if (typeof props[item] === 'object') {
      newProps[item] = {
        type: Object,
        default: () => props[item],
      }
    } else {
      newProps[item] = {
        default: props[item],
      }
    }
  })
  return newProps
}

export function getEvents() {
  return [
    'update:value',
    'dragstart',
    'drag',
    'dragend',
    'rotatestart',
    'rotate',
    'rotateend',
    'resizestart',
    'resize',
    'resizeend',
    'change',
  ]
}
