<template>
  <Teleport to="body"><Transition name="project-fade">
    <div v-if="open" class="project-overlay" @keydown.esc.stop="close" @click.self="close">
      <form class="project-modal profile-color-modal" role="dialog" aria-modal="true" :aria-label="t('settingsPage.profileColor')" @submit.prevent="apply">
        <button type="button" class="project-close" :aria-label="t('common.cancel')" @click="close"><AppIcon name="x" :size="18" /></button>
        <h2>{{ t('settingsPage.profileColor') }}</h2>
        <UserAvatar class="color-avatar-preview" :username="username" :color="draftColor" />
        <ClassicColorPicker inline hide-adjustments :model-value="draftColor" @update:model-value="draftColor = $event" />
        <p v-if="error" class="project-error" role="alert">{{ error }}</p>
        <div class="project-modal-actions"><button type="button" :disabled="saving" @click="close">{{ t('common.cancel') }}</button><button :disabled="saving">{{ t('common.apply') }}</button></div>
      </form>
    </div>
  </Transition></Teleport>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'
import ClassicColorPicker from '@/components/palette/ColorPicker.vue'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { useI18n } from '@/i18n'
const props = defineProps<{ open: boolean; color: string; username: string; saving?: boolean; error?: string }>()
const emit = defineEmits<{ close: []; apply: [color: string] }>()
const { t } = useI18n(), draftColor = ref(props.color)
watch(() => props.open, open => { if (open) draftColor.value = props.color })
function close() { if (!props.saving) emit('close') }
function apply() { if (!props.saving) emit('apply', draftColor.value) }
</script>
<style scoped>
.color-avatar-preview{width:70px;height:70px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:46px;margin-bottom:18px}.profile-color-modal :deep(.cp-panel--inline){width:100%;min-width:0;padding:0;background:transparent;box-shadow:none;border:0}
.profile-color-modal :deep(.cp-field label){margin:0}
</style>
