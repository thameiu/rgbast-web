<template>
  <div v-if="invitations.length" class="notification-projects">
    <p class="notification-projects-title">{{ t('header.projectInvitations') }}</p>
    <article v-for="invitation in invitations" :key="invitation.id" class="notification-project-item">
      <button class="notification-project-user" @click="$emit('openUser', invitation.inviter.username)">
        <UserAvatar class="notification-project-avatar" :username="invitation.inviter.username" :color="invitation.inviter.profile_color" />
        <span>{{ invitation.inviter.username }}</span>
      </button>
      <p class="notification-project-title">{{ invitation.title }}</p>
      <div class="notification-project-actions">
        <button :disabled="pendingId === invitation.id" @click="$emit('respond', invitation.id, true)">{{ t('header.accept') }}</button>
        <button :disabled="pendingId === invitation.id" @click="$emit('respond', invitation.id, false)">{{ t('header.deny') }}</button>
      </div>
    </article>
  </div>
</template>
<script setup lang="ts">
import type { ProjectInvitation } from '@/api/projects'
import UserAvatar from '@/components/ui/UserAvatar.vue'
import { useI18n } from '@/i18n'
defineProps<{ invitations: ProjectInvitation[]; pendingId: number | null }>()
defineEmits<{ respond: [id: number, accept: boolean]; openUser: [username: string] }>()
const { t } = useI18n()
</script>
<style scoped>
.notification-projects{display:grid;gap:8px;min-width:0}.notification-projects-title{font-size:11px;font-weight:700;color:var(--ink-3);margin:6px 0}.notification-project-item{padding:10px;border:1px solid var(--rule);border-radius:10px;background:#fff;min-width:0}.notification-project-user{display:flex;align-items:center;gap:8px;background:none;border:0;color:var(--ink);cursor:pointer;padding:0;max-width:100%;font:600 12px var(--font-sans)}.notification-project-user span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.notification-project-avatar{width:24px;height:24px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px}.notification-project-title{font:700 23px var(--font-display);color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin:8px 0}.notification-project-actions{display:flex;gap:6px}.notification-project-actions button{padding:6px 10px;border:1px solid var(--rule);border-radius:7px;background:#fff;color:var(--ink);font:600 11px var(--font-sans);cursor:pointer}.notification-project-actions button:first-child{background:var(--ink);color:#fff}.notification-project-actions button:disabled{opacity:.45;cursor:not-allowed}
</style>
