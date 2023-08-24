import { DDRProps } from "./type"
import { useDDRBehavior } from "./behavior"
import  './index.style.less';
import { defineComponent, getCurrentInstance, useSlots } from "vue";
import { getDDRProps, getEvents } from "./defaults";

const DDR = defineComponent<Partial<DDRProps>>((props) => {
  const { setMouseDownHandler, behavior, domWrapper, transform } = useDDRBehavior(props,getCurrentInstance()!)
  const slots = useSlots()
  // 使用经过默认值处理的props
  return () => {
    return (
      <div
        ref={domWrapper}
        class={behavior.getClassNames()}
        style={behavior.getNewStyle(transform.value)}
        onTouchstart={setMouseDownHandler as any}
        onMousedown={setMouseDownHandler as any}>
      
        {slots.default && slots.default()}
        {
            props.resizable &&  <div class='resize-handler-wrapper'>
            {props.resizeHandler?.map((item) => {
              return <span data-resizetype={item} key={item} style={behavior.getNewHandler(item)} class={`resize-handler ${item}`} />;
            })}
                
          </div>
        }
       {props.rotatable && <span style={behavior.getRotateHandler()} data-type='rotate' class='rotate-handler' />}
    </div>
    )
  }
}, {
  props: getDDRProps(),
  emits:getEvents()
})


export default DDR