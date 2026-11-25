<template>
  <div ref="root" class="member-picker">
    <input ref="input" :value="query" role="combobox" aria-autocomplete="list" :aria-expanded="open" :aria-controls="listId" :aria-activedescendant="activeIndex >= 0 && open ? `${listId}-${activeIndex}` : undefined" :aria-label="t('projects.searchUsers')" :placeholder="t('projects.searchUsers')" :disabled="disabled" @input="emit('update:query', ($event.target as HTMLInputElement).value); open = true; activeIndex = -1" @focus="show" @blur="open = false" @keydown="onKeydown" />
    <button type="button" :disabled="disabled || loading || !query.trim()" :aria-label="t('common.search')" @pointerdown.prevent @click="show(); emit('search')"><AppIcon name="search" :size="16" /></button>
    <Teleport to="body"><Transition name="member-suggestions">
      <div v-if="open" :id="listId" ref="menu" role="listbox" :aria-label="t('projects.searchUsers')" class="member-picker-menu" :style="menuStyle">
        <p v-if="loading" role="status">{{ t('colleaguesModal.searching') }}</p>
        <template v-else>
          <button v-for="(user, index) in users" :id="`${listId}-${index}`" :key="user.id" type="button" role="option" :aria-selected="activeIndex === index" @pointerdown.prevent @click="choose(user)">
            <UserAvatar class="member-picker-avatar" :username="user.username" :color="user.profile_color" />
            <span class="member-picker-meta"><strong>{{ user.username }}</strong><small v-if="user.firstname || user.lastname">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') }}</small></span>
          </button>
          <p v-if="!users.length">{{ t('colleaguesModal.noSearchResults') }}</p>
        </template>
      </div>
    </Transition></Teleport>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { useI18n } from '@/i18n'
interface MemberOption { id: number; username: string; profile_color?: string | null; firstname?: string | null; lastname?: string | null }
const props = defineProps<{ query: string; users: MemberOption[]; loading?: boolean; disabled?: boolean }>()
const emit = defineEmits<{ 'update:query': [value: string]; select: [user: MemberOption]; search: [] }>()
const { t } = useI18n(), listId = useId()
const root = ref<HTMLElement | null>(null), input = ref<HTMLInputElement | null>(null), menu = ref<HTMLElement | null>(null)
const open = ref(false), activeIndex = ref(-1), menuStyle = ref<Record<string, string>>({})
let selecting = false
function position() {
  if (!open.value || !input.value) return
  const rect = input.value.getBoundingClientRect(), below = window.innerHeight - rect.bottom - 16, above = rect.top - 16
  const upward = below < 150 && above > below
  menuStyle.value = { left: `${rect.left}px`, width: `${rect.width}px`, maxHeight: `${Math.max(60, Math.min(260, upward ? above : below))}px`, ...(upward ? { bottom: `${window.innerHeight - rect.top + 8}px` } : { top: `${rect.bottom + 8}px` }) }
}
function show() { open.value = true; position() }
function choose(user: MemberOption) {
  selecting = true
  emit('select', user); open.value = false; activeIndex.value = -1
  void nextTick(() => { selecting = false })
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); open.value = false }
  else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); show()
    if (props.users.length) activeIndex.value = (activeIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + props.users.length) % props.users.length
    void nextTick(() => menu.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }))
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const user = open.value ? props.users[activeIndex.value] : undefined
    if (user) choose(user)
    else { show(); emit('search') }
  }
}
function dismiss(event: Event) { if (!root.value?.contains(event.target as Node) && !menu.value?.contains(event.target as Node)) open.value = false }
watch(() => props.users, () => { activeIndex.value = -1; if (!selecting && document.activeElement === input.value) show() })
watch(() => props.disabled, value => { if (value) open.value = false })
onMounted(() => { document.addEventListener('pointerdown', dismiss); window.addEventListener('scroll', position, true); window.addEventListener('resize', position) })
onBeforeUnmount(() => { document.removeEventListener('pointerdown', dismiss); window.removeEventListener('scroll', position, true); window.removeEventListener('resize', position) })
</script>
<style scoped>
.member-picker{display:flex;gap:8px;min-width:0}.member-picker input{min-width:0;flex:1}.member-picker>button{display:flex;align-items:center;justify-content:center;flex-shrink:0}
.member-picker-menu{position:fixed;z-index:750;overflow:auto;scrollbar-width:thin;border:1px solid var(--rule);border-radius:12px;background:rgba(255,255,255,.98);box-shadow:0 10px 24px rgba(14,14,16,.12)}
.member-picker-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:12px;border:0;background:transparent;color:var(--ink);text-align:left;cursor:pointer;transition:background .16s ease-in-out,color .16s ease-in-out}
.member-picker-menu button+button{border-top:1px solid var(--rule)}.member-picker-menu button:hover,.member-picker-menu button[aria-selected=true]{background:var(--ink);color:#fff}
.member-picker-avatar{width:34px;height:34px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;padding-top:2px;flex-shrink:0}
.member-picker-meta{display:flex;flex-direction:column;gap:3px;min-width:0;font:500 13px var(--font-sans)}.member-picker-meta strong,.member-picker-meta small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.member-picker-meta small{font-size:11px;opacity:.65}.member-picker-menu p{padding:12px;font-size:12px;color:var(--ink-2)}
.member-suggestions-enter-active,.member-suggestions-leave-active{transition:opacity .16s ease-in-out,transform .16s ease-in-out}.member-suggestions-enter-from,.member-suggestions-leave-to{opacity:0;transform:translateY(-4px)}
@media(prefers-reduced-motion:reduce){.member-suggestions-enter-active,.member-suggestions-leave-active{transition:none}}
</style>
