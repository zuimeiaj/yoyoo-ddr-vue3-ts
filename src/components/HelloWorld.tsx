import { defineComponent, ref } from 'vue'
export default defineComponent({
  setup() {
    const count = ref(1)
    return () => {
      return (
        <div onClick={() => count.value++}>
          <button>{count.value}</button>
        </div>
      )
    }
  },
})
