import { defineComponent, ref } from 'vue'
import DDR from './components'
import { TransformProps } from './components/type'

export default defineComponent({
  setup() {
    const t = ref<TransformProps>({ x: 100, y: 100, width: 100, height: 100, rotation: 0 })
    return () => {
      return (
        <div style={'width:100%;height:100%'}>
          <DDR
            axis="x"
            minHeight={20}
            minWidth={20}
            maxWidth={200}
            maxHeight={200}
            parent={true}
            grid={[10, 10]}
            v-model:value={t.value}
          >
            <div style={{ width: '100%', height: '100%', background: 'red' }}>
              <div>x= {t.value.x}</div>
              <div>y= {t.value.y}</div>
              <div>w= {t.value.width}</div>
              <div>h= {t.value.height}</div>
            </div>
          </DDR>
          <button onClick={() => (t.value.x += 100)}> to right</button>
        </div>
      )
    }
  },
})
