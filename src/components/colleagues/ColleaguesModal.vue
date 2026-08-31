<template>
  <Teleport to="body">
    <Transition name="colleagues-fade">
      <div v-if="open" class="colleagues-overlay" @click.self="emit('close')">
        <div class="colleagues-modal" role="dialog" aria-modal="true" :aria-label="t('colleaguesModal.title')">
          <div class="colleagues-head">
            <h2 class="colleagues-title font-display">{{ t('colleaguesModal.title') }}</h2>
            <button class="colleagues-close" @click="emit('close')">×</button>
          </div>

          <div v-if="!isPublicMode" class="colleagues-tabs">
            <button class="colleagues-tab" :class="{ active: activeTab === 'colleagues' }" @click="activeTab = 'colleagues'">
              <IconUsers class="tab-icon" />
              {{ list.colleagues.length }} {{ list.colleagues.length === 1 ? t('profilePage.colleague') : t('profilePage.colleagues') }}
            </button>
            <button class="colleagues-tab" :class="{ active: activeTab === 'sent' }" @click="activeTab = 'sent'">
              <IconClock3 class="tab-icon" />
              {{ list.outgoing_pending.length }} {{ t('colleaguesModal.sent') }}
            </button>
            <button class="colleagues-tab" :class="{ active: activeTab === 'requests' }" @click="activeTab = 'requests'">
              <IconMail class="tab-icon" />
              {{ list.incoming_pending.length }} {{ t('colleaguesModal.requests') }}
            </button>
            <button class="colleagues-tab" :class="{ active: activeTab === 'add' }" @click="activeTab = 'add'">
              <IconUsers class="tab-icon" />
              {{ t('colleaguesModal.add') }}
            </button>
          </div>

          <div class="colleagues-body">
            <AppLoader v-if="loading" :message="t('colleaguesModal.loading')" />
            <p v-else-if="error" class="colleagues-error">{{ error }}</p>

            <div v-else>
              <template v-if="!isPublicMode && activeTab === 'add'">
                <form class="colleagues-search" @submit.prevent="searchUsers">
                  <input
                    v-model="searchQuery"
                    class="colleagues-search-input"
                    :placeholder="t('colleaguesModal.searchPlaceholder')"
                    @keydown.escape.prevent="clearSearch"
                  />
                  <button class="colleagues-search-btn" type="submit" :disabled="searchLoading || !searchQuery.trim()" :aria-label="t('common.search')">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.6" />
                      <path d="M10.6 10.6L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                  </button>
                </form>
                <p v-if="searchError" class="colleagues-error">{{ searchError }}</p>
                <AppLoader v-else-if="searchLoading" :message="t('colleaguesModal.searching')" />
                <div v-else-if="searchDone && searchResults.length === 0" class="colleagues-empty">
                  {{ t('colleaguesModal.noSearchResults') }}
                </div>
                <div v-else-if="searchResults.length" class="colleagues-list">
                  <div v-for="user in searchResults" :key="user.id" class="colleagues-item">
                    <button class="colleagues-user" @click="openProfile(user.username)">
                      <span class="colleagues-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
                      <span class="colleagues-meta">
                        <span class="colleagues-username">{{ user.username }}</span>
                        <span class="colleagues-name">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') || '-' }}</span>
                      </span>
                    </button>
                    <div class="colleagues-actions">
                      <button
                        class="col-btn"
                        :class="{ 'col-btn-primary': searchUserStatus(user.username) === 'none' || searchUserStatus(user.username) === 'incoming' }"
                        :disabled="pendingUser === user.username || searchUserStatus(user.username) === 'accepted' || searchUserStatus(user.username) === 'outgoing'"
                        @click="addSearchUser(user.username)"
                      >
                        {{ searchUserActionLabel(user.username) }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="colleagues-empty">{{ t('colleaguesModal.searchHint') }}</div>
              </template>

              <template v-else>
                <div v-if="activeUsers.length === 0" class="colleagues-empty">
                  {{ emptyLabel }}
                </div>

                <div v-else class="colleagues-list">
                  <div v-for="user in activeUsers" :key="user.id" class="colleagues-item">
                    <button class="colleagues-user" @click="openProfile(user.username)">
                      <span class="colleagues-avatar">{{ user.username.charAt(0).toUpperCase() }}</span>
                      <span class="colleagues-meta">
                        <span class="colleagues-username">{{ user.username }}</span>
                        <span class="colleagues-name">{{ [user.firstname, user.lastname].filter(Boolean).join(' ') || '-' }}</span>
                      </span>
                    </button>

                    <div v-if="!isPublicMode && props.removeConfirmMode === 'inline' && inlineConfirmUser === user.username" class="colleagues-inline-confirm">
                      <span>{{ t('colleaguesModal.areYouSure') }}</span>
                      <button class="col-btn col-btn-primary" :disabled="pendingUser === user.username" @click="removeUser(user.username)">{{ t('common.yes') }}</button>
                      <button class="col-btn" :disabled="pendingUser === user.username" @click="cancelInlineConfirm">{{ t('common.no') }}</button>
                    </div>
                    <div v-else-if="!isPublicMode" class="colleagues-actions">
                      <template v-if="activeTab === 'requests'">
                        <button class="col-btn col-btn-primary" :disabled="pendingUser === user.username" @click="acceptUser(user.username)">
                          {{ t('header.accept') }}
                        </button>
                        <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                          {{ t('header.deny') }}
                        </button>
                      </template>

                      <template v-else-if="activeTab === 'sent'">
                        <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                          {{ t('profilePage.removeRequest') }}
                        </button>
                      </template>

                      <template v-else>
                        <button class="col-btn" :disabled="pendingUser === user.username" @click="requestRemove(user.username)">
                          {{ t('profilePage.remove') }}
                        </button>
                      </template>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <Transition name="col-confirm-fade">
          <div v-if="!isPublicMode && props.removeConfirmMode === 'modal' && modalConfirmUser" class="colleagues-confirm-overlay" @click.self="closeConfirmModal">
            <div class="colleagues-confirm-modal">
              <p class="colleagues-confirm-title font-display">{{ t('profilePage.confirm') }}</p>
              <p class="colleagues-confirm-text">
                {{ t('colleaguesModal.confirmText', { action: removeConfirmLabel }) }}
                <strong>{{ modalConfirmUser }}</strong>?
              </p>
              <div class="colleagues-confirm-actions">
                <button class="col-btn" :disabled="pendingUser === modalConfirmUser" @click="closeConfirmModal">{{ t('common.no') }}</button>
                <button class="col-btn col-btn-primary" :disabled="pendingUser === modalConfirmUser" @click="modalConfirmUser && removeUser(modalConfirmUser)">
                  {{ t('common.yes') }}
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
import { searchApi } from '@/api/search'
import type { ColleagueListResponse, ColleagueUserItem } from '@/api/types'
import type { UserSearchItem } from '@/api/types'
import { useI18n } from '@/i18n'

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
const { t } = useI18n()

const loading = ref(false)
const error = ref('')
const pendingUser = ref<string | null>(null)
const activeTab = ref<'colleagues' | 'sent' | 'requests' | 'add'>('colleagues')
const inlineConfirmUser = ref<string | null>(null)
const modalConfirmUser = ref<string | null>(null)
const isPublicMode = computed(() => props.viewMode === 'public')
const searchQuery = ref('')
const searchResults = ref<UserSearchItem[]>([])
const searchLoading = ref(false)
const searchError = ref('')
const searchDone = ref(false)
const currentUsername = computed(() => getTokenUsername()?.toLowerCase() ?? null)

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
  if (isPublicMode.value) return t('colleaguesModal.emptyColleagues')
  if (activeTab.value === 'colleagues') return t('colleaguesModal.emptyColleagues')
  if (activeTab.value === 'sent') return t('colleaguesModal.emptySent')
  if (activeTab.value === 'add') return t('colleaguesModal.searchHint')
  return t('colleaguesModal.emptyIncoming')
})

async function loadList(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    if (isPublicMode.value) {
      if (!props.publicUsername) throw new Error(t('colleaguesModal.missingUsername'))
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
    error.value = e?.message ?? t('colleaguesModal.couldNotLoad')
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

type SearchRelationStatus = 'accepted' | 'outgoing' | 'incoming' | 'none'

function searchUserStatus(username: string): SearchRelationStatus {
  if (list.value.colleagues.some(user => user.username === username)) return 'accepted'
  if (list.value.outgoing_pending.some(user => user.username === username)) return 'outgoing'
  if (list.value.incoming_pending.some(user => user.username === username)) return 'incoming'
  return 'none'
}

function searchUserActionLabel(username: string): string {
  const status = searchUserStatus(username)
  if (status === 'accepted') return t('profilePage.colleague')
  if (status === 'outgoing') return t('profilePage.requestSent')
  if (status === 'incoming') return t('profilePage.acceptRequest')
  return t('profilePage.addColleague')
}

function getTokenUsername(): string | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
    const payload = JSON.parse(atob(normalized + pad))
    return typeof payload?.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

async function searchUsers(): Promise<void> {
  const query = searchQuery.value.trim()
  if (!query) return
  searchLoading.value = true
  searchError.value = ''
  searchDone.value = false
  try {
    const payload = await searchApi.searchUsers(query)
    const needle = query.toLowerCase()
    searchResults.value = payload.results.filter((user) => {
      const username = user.username.toLowerCase()
      return username.includes(needle) && username !== currentUsername.value
    })
    searchDone.value = true
  } catch (e: any) {
    searchError.value = e?.message ?? t('colleaguesModal.searchFailed')
  } finally {
    searchLoading.value = false
  }
}

async function addSearchUser(username: string): Promise<void> {
  const status = searchUserStatus(username)
  if (status === 'accepted' || status === 'outgoing') return
  pendingUser.value = username
  try {
    if (status === 'incoming') {
      await colleaguesApi.accept(username)
    } else {
      await colleaguesApi.addOrAccept(username)
    }
    await loadList()
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
    emit('updated')
  } catch (e: any) {
    searchError.value = e?.message ?? t('colleaguesModal.addFailed')
  } finally {
    pendingUser.value = null
  }
}

function clearSearch(): void {
  searchQuery.value = ''
  searchResults.value = []
  searchError.value = ''
  searchDone.value = false
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
  if (activeTab.value === 'sent') return t('colleaguesModal.removeRequest')
  if (activeTab.value === 'requests') return t('colleaguesModal.denyRequest')
  return t('colleaguesModal.removeColleague')
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
      clearSearch()
      return
    }
    void loadList()
  },
)
</script>

<style scoped src="./ColleaguesModal.css"></style>
