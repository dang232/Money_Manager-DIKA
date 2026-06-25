import { ref, watch, type Ref } from 'vue'
import gsap from 'gsap'

export function useGsapNumber(source: Ref<number>, duration = 0.6) {
  const displayValue = ref(source.value)
  const isAnimating = ref(false)

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  watch(source, (newVal) => {
    if (prefersReducedMotion) {
      displayValue.value = newVal
      return
    }

    isAnimating.value = true
    gsap.to(displayValue, {
      value: newVal,
      duration,
      ease: 'power2.out',
      onComplete: () => {
        isAnimating.value = false
      },
    })
  })

  return { displayValue, isAnimating }
}
