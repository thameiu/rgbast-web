<template>
  <Teleport to="body">
    <Transition name="colleagues-fade">
      <div v-if="open" class="colleagues-overlay" @click.self="emit('close')">
        <div class="colleagues-modal" role="dialog" aria-modal="true" aria-label="Colleagues">
          <div class="colleagues-head">
            <h2 class="colleagues-title font-display">Colleagues</h2>
            <button class="colleagues-close" @click="emit('close')">×</button>
          </div>

          <div v-if="!isPublicMode" class="colleagues-tabs">
            <button class="colleagues-tab" :class="{ active: activeTab === 'colleagues' }" @click="activeTab = 'colleagues'">
              <IconUsers class="tab-icon" />
              {{ list.colleagues.length }} {{ list.colleagues.length === 1 ? 'Colleague' : 'Colleagues' }}
            </button>
            <button class="colleagues-tab" :class="{ active: activeTab === 'sent' }" @click="activeTab = 'sent'">
              <IconClock3 class="tab-icon" />
              {{ list.outgoing_pending.length }} Sent
            </button>
            <button class="colleagues-tab" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
              <IconMail class="tab-icon" />
              {{ list.incoming_pending.length }} Requests
            </button>
          </div>

          <div class="colleagues-body">
            <AppLoader v-if="loading" message="Loading colleagues..." />
            <p v-else-if="error" class="colleagues-error">{{ error }}</p>

            <div v-else>
              <div v-if="activeUsers.length === 0" class="colleagues-empty">
                {{ emptyLabel }}
              </div>

              <div v-else class="colleagues-list">
                <div v-for="user in activeUsers" :key="user.id" class="colleagues-item">
                  <button class="colleagues-user" @click="openProfile(user.username)">
                    <span class="colleagues-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
                    <span class="colleagues-meta">
                      <span class="colleagues-username">{{ user.username }}</span>
                      <span class="colleagues-name">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') || '—' }}</span>
                    </span>
                  </button>

                  <div v-if="!isPublicMode && props.removeConfirmMode === 'inline' && inlineConfirmUser === user.username" class="colleagues-inline-confirm">
                    <span>Are you sure?</span>
                    <button class="col-btn col-btn-primary" :disabled="pendingUser === user.username" @click="removeUser(user.username)">Yes</button>
                    <button class="col-btn" :disabled="pendingUser === user.username" @click="cancelInlineConfirm">No</button>
                  </div>
                  <div v-else-if="!isPublicMode" class="colleagues-actions">
                    <template v-if="activeTab === 'requests'">
                      <button class="col-btn col-btn-primary" :disabled="pendingUser === user.username" @click="acceptUser(user.username)">
                        Accept
                      </button>
                      <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                        Deny
                      </button>
                    </template>

                    <template v-else-if="activeTab === 'sent'">
                      <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                        Remove request
                      </button>
                    </template>

                    <template v-else>
                      <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                        Remove
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Transition name="col-confirm-fade">
          <div v-if="!isPublicMode && props.removeConfirmMode === 'modal' && modalConfirmUser" class="colleagues-confirm-overlay" @click.self="closeConfirmModal">
            <div class="colleagues-confirm-modal">
              <p class="colleagues-confirm-title font-display">Confirm</p>
              <p class="colleagues-confirm-text">
                Do you want to {{ removeConfirmLabel }} with
                <strong>{{ modalConfirmUser }}</strong>?
              </p>
              <div class="colleagues-confirm-actions">
                <button class="col-btn" :disabled="pendingUser === modalConfirmUser" @click="closeConfirmModal">No</button>
                <button class="col-btn col-btn-primary" :disabled="pendingUser === modalConfirmUser" @click="modalConfirmUser && removeUser(modalConfirmUser)">
                  Yes
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLoader from '@/components/ui/AppLoader.vue'
import IconUsers from '@/components/icons/IconUsers.vue'
import IconClock3 from '@/components/icons/IconClock3.vue'
import IconMail from '@/components/icons/IconMail.vue'
import { colleaguesApi } from '@/api/colleagues'
import type { ColleagueListResponse, ColleagueUserItem } from '@/api/types'

const props = withDefaults(defineProps<{
  open: boolean
  removeConfirmMode?: 'inline' | 'modal'
  viewMode?: 'mine' | 'public'
  publicUsername?: string | null
}>(), {
  removeConfirmMode: 'inline',
  viewMode: 'mine',
  publicUsername: null,
})
const emit = defineEmits<{ close: []; updated: [] }>()

const router = useRouter()

const loading = ref(false)
const error = ref('')
const pendingUser = ref<string | null>(null)
const activeTab = ref<'colleagues' | 'sent' | 'requests'>('colleagues')
const inlineConfirmUser = ref<string | null>(null)
const modalConfirmUser = ref<string | null>(null)
const isPublicMode = computed(() => props.viewMode === 'public')

const list = ref<ColleagueListResponse>({
  colleagues: [],
  outgoing_pending: [],
  incoming_pending: [],
  incoming_count: 0,
})

const activeUsers = computed<ColleagueUserItem[]>(() => {
  if (isPublicMode.value) return list.value.colleagues
  if (activeTab.value === 'colleagues') return list.value.colleagues
  if (activeTab.value === 'sent') return list.value.outgoing_pending
  return list.value.incoming_pending
})

const emptyLabel = computed(() => {
  if (isPublicMode.value) return 'No colleagues yet.'
  if (activeTab.value === 'colleagues') return 'No colleagues yet.'
  if (activeTab.value === 'sent') return 'No pending requests sent.'
  return 'No incoming requests.'
})

async function loadList(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    if (isPublicMode.value) {
      if (!props.publicUsername) throw new Error('Missing profile username.')
      const payload = await colleaguesApi.listByUsername(props.publicUsername)
      list.value = {
        colleagues: payload.colleagues,
        outgoing_pending: [],
        incoming_pending: [],
        incoming_count: 0,
      }
    } else {
      list.value = await colleaguesApi.listMine()
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Could not load colleagues.'
  } finally {
    loading.value = false
  }
}

async function acceptUser(username: string): Promise<void> {
  pendingUser.value = username
  try {
    await colleaguesApi.accept(username)
    await loadList()
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
    emit('updated')
  } finally {
    pendingUser.value = null
  }
}

async function removeUser(username: string): Promise<void> {
  pendingUser.value = username
  try {
    await colleaguesApi.remove(username)
    await loadList()
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
    emit('updated')
  } finally {
    pendingUser.value = null
    inlineConfirmUser.value = null
    modalConfirmUser.value = null
  }
}

function requestRemove(username: string): void {
  if (props.removeConfirmMode === 'modal') {
    modalConfirmUser.value = username
    return
  }
  inlineConfirmUser.value = username
}

function cancelInlineConfirm(): void {
  inlineConfirmUser.value = null
}

function closeConfirmModal(): void {
  modalConfirmUser.value = null
}

const removeConfirmLabel = computed(() => {
  if (activeTab.value === 'sent') return 'remove this request'
  if (activeTab.value === 'requests') return 'deny this request'
  return 'remove this colleague'
})

function openProfile(username: string): void {
  emit('close')
  void router.push(`/users/${encodeURIComponent(username)}`)
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      inlineConfirmUser.value = null
      modalConfirmUser.value = null
      return
    }
    void loadList()
  },
)
</script>

<style scoped src="./ColleaguesModal.css"></style>
