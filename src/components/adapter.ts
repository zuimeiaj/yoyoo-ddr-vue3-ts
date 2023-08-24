import { Ref, ref } from 'vue';

export function useState<T>(initialValue: T): [T, (value: T) => void] {
  let refObject = ref<T>(initialValue) as Ref<T>;

  return [
    refObject.value,
    function setValue(value: any) {
      refObject.value = value;
    },
  ];
}
