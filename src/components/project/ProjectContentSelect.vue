<template>
  <div ref="root" class="project-select" @keydown="onKeydown">
    <button ref="trigger" type="button" class="project-select-trigger" :disabled="disabled" aria-haspopup="listbox" :aria-expanded="open" :aria-label="label" @click="toggle">
      <UserAvatar v-if="selected?.username" :username="selected.username" :color="selected.profile_color" class="project-select-avatar" /><span class="project-select-content">
        <span class="project-select-title">{{ selected?.title ?? placeholder }}</span>
        <span v-if="selected?.subtitle" class="project-select-subtitle">{{ selected.subtitle }}</span>
        <span v-if="selected?.colors?.length" class="project-select-colors" aria-hidden="true">
          <span v-for="(color, index) in selected.colors.slice(0, 15)" :key="index" :style="{ background: '#' + color.hex.replace(/^#/, '') }" />
        </span>
      </span>
      <AppIcon name="chevron-down" :size="16" class="project-select-chevron" :class="{ 'is-open': open }" />
    </button>
    <Teleport to="body"><Transition name="project-select-fade">
      <div v-if="open" ref="menu" class="project-select-menu" :class="{ 'project-select-menu--dark': darkMenu }" :style="menuStyle" role="listbox" :aria-label="label" @keydown="onKeydown">
        <button v-for="option in options" :key="option.id ?? 'personal'" type="button" role="option" :aria-selected="option.id === modelValue" tabindex="-1" class="project-select-option" @click="select(option.id)">
          <UserAvatar v-if="option.username" :username="option.username" :color="option.profile_color" class="project-select-avatar" /><span class="project-select-content">
            <span class="project-select-title">{{ option.title }}</span>
            <span v-if="option.subtitle" class="project-select-subtitle">{{ option.subtitle }}</span>
            <span v-if="option.colors?.length" class="project-select-colors" aria-hidden="true">
              <span v-for="(color, index) in option.colors.slice(0, 15)" :key="index" :style="{ background: '#' + color.hex.replace(/^#/, '') }" />
            </span>
          </span>
          <AppIcon v-if="option.id === modelValue" name="check" :size="16" />
        </button>
      </div>
    </Transition></Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'

export interface ProjectContentOption {
  id: number | null
  title: string
  subtitle?: string
  colors?: { hex: string }[]
  username?: string
  profile_color?: string
}
const props = defineProps<{
  modelValue: number | null
  options: ProjectContentOption[]
  label: string
  placeholder?: string
  disabled?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const root = ref<HTMLElement | null>(null), trigger = ref<HTMLButtonElement | null>(null), open = ref(false)
const menu = ref<HTMLElement | null>(null), darkMenu = ref(false)
const menuStyle = ref<Record<string, string>>({})
function positionMenu() {
  if (!open.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  const below = window.innerHeight - rect.bottom - 16, above = rect.top - 16
  const upward = below < 160 && above > below
  const height = Math.max(60, Math.min(260, upward ? above : below))
  menuStyle.value = { position: 'fixed', left: `${rect.left}px`, width: `${rect.width}px`, maxHeight: `${height}px`, zIndex: '750', ...(upward ? { bottom: `${window.innerHeight - rect.top + 8}px` } : { top: `${rect.bottom + 8}px` }) }
  darkMenu.value = !!root.value?.closest('.project-modal--dark, .project-destination-modal')
}
const selected = computed(() => props.options.find(option => option.id === props.modelValue))
const optionButtons = () => Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])
async function toggle() {
  open.value = !open.value
  if (open.value) {
    positionMenu()
    await nextTick()
    const buttons = optionButtons()
    ;(buttons.find(button => button.getAttribute('aria-selected') === 'true') ?? buttons[0])?.focus()
  }
}
function select(id: number | null) {
  emit('update:modelValue', id)
  open.value = false
  trigger.value?.focus()
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault(); event.stopPropagation()
    open.value = false; trigger.value?.focus()
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && !props.disabled) {
    event.preventDefault(); event.stopPropagation()
    if (!open.value) { void toggle(); return }
    const buttons = optionButtons(), current = buttons.indexOf(document.activeElement as HTMLButtonElement)
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[index]?.focus()
  } else if (event.key === 'Tab') open.value = false
}
function dismiss(event: Event) {
  if (!root.value?.contains(event.target as Node) && !menu.value?.contains(event.target as Node)) open.value = false
}
watch(() => props.disabled, disabled => { if (disabled) open.value = false })
onMounted(() => { document.addEventListener('pointerdown', dismiss); document.addEventListener('focusin', dismiss); window.addEventListener('resize', positionMenu); window.addEventListener('scroll', positionMenu, true) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('focusin', dismiss); window.removeEventListener('resize', positionMenu); window.removeEventListener('scroll', positionMenu, true) })
</script>

<style scoped src="./ProjectContentSelect.css"></style>
