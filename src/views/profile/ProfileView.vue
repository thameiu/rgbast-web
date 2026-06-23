<template>
  <main class="profile-view">
    <span class="regmark regmark-tl" aria-hidden="true"></span>
    <span class="regmark regmark-tr" aria-hidden="true"></span>
    <span class="regmark regmark-bl" aria-hidden="true"></span>
    <span class="regmark regmark-br" aria-hidden="true"></span>

    <SiteHeader :user="viewerUser" brand-meta="profiles" />

    <section class="profile-shell">
      <AppLoader v-if="loading" message="Loading profile..." />

      <div v-else-if="errorMessage" class="profile-error">
        <h1 class="profile-error-title font-display">Profile unavailable</h1>
        <p class="profile-error-text">{{ errorMessage }}</p>
      </div>

      <template v-else-if="profileUser">
        <header class="profile-head">
          <div class="profile-avatar">{{ profileUser.username.charAt(0).toUpperCase() }}</div>
          <div class="profile-main">
            <h1 class="profile-username font-display">{{ profileUser.username }}</h1>
            <p class="profile-fullname">
              {{ fullName }}
            </p>
            <div class="profile-meta-actions">
              <button class="profile-colleagues-link font-mono" @click="onColleaguesClick">
                {{ colleaguesCountLabel }}
              </button>

              <template v-if="!isOwnProfile">
                <div class="profile-colleague-wrap">
                  <button
                    class="profile-colleague-btn"
                    :class="{
                      'is-accepted': relationStatus === 'accepted',
                      'is-pending': relationStatus === 'pending_outgoing',
                      'is-incoming': relationStatus === 'pending_incoming',
                    }"
                    :disabled="relationLoading"
                    @click="onPrimaryColleagueAction"
                  >
                    <IconUsers v-if="relationStatus === 'accepted'" class="profile-colleague-icon" />
                    <IconClock3 v-else-if="relationStatus === 'pending_outgoing'" class="profile-colleague-icon" />
                    <IconMail v-else-if="relationStatus === 'pending_incoming'" class="profile-colleague-icon" />
                    <IconUsers v-else class="profile-colleague-icon" />
                    {{ relationPrimaryLabel }}
                  </button>

                  <button
                    v-if="showSecondaryAction"
                    class="profile-colleague-remove"
                    :disabled="relationLoading"
                    :title="secondaryActionLabel"
                    @click="onRemoveCrossClick"
                  >
                    ×
                  </button>
                </div>
              </template>
            </div>
          </div>
        </header>

        <div class="section-bar">
          <div class="profile-view-toggle">
            <button
              class="profile-view-toggle-btn font-display"
              :class="{ 'profile-view-toggle-btn--active': contentMode === 'palettes' }"
              @click="contentMode = 'palettes'"
            >
              <span class="profile-view-toggle-label">Palettes</span>
            </button>
            <button
              class="profile-view-toggle-btn font-display"
              :class="{ 'profile-view-toggle-btn--active': contentMode === 'bookmarks' }"
              @click="contentMode = 'bookmarks'"
            >
              <span class="profile-view-toggle-label">Bookmarks</span>
            </button>
          </div>
          <p class="breadcrumb-all font-mono">{{ contentMode === 'palettes' ? palettesSubtitle : bookmarksSubtitle }}</p>
        </div>

        <div class="profile-content" :class="{ 'profile-content--bookmarks': contentMode === 'bookmarks' }">
          <aside v-if="contentMode === 'palettes'" class="profile-folders">
            <p class="profile-folders-label font-mono">Folders</p>
            <FolderTree
              :folders="folders"
              v-model="activeFolderKey"
              theme="light"
              mode="navigation"
              :allowFolderEditing="false"
              :paletteCounts="folderCounts"
              :totalCount="palettes.length"
              :rootCount="rootPaletteCount"
              :palettes="palettes"
              @selectPalette="openPalette"
            />
          </aside>

          <section class="profile-palettes">
            <p v-if="contentMode === 'palettes' && filteredPalettes.length === 0" class="profile-empty">
              No palettes in this folder.
            </p>

            <div v-else-if="contentMode === 'palettes'" class="palettes-grid">
              <PaletteCard
                v-for="palette in filteredPalettes"
                :key="palette.id"
                :palette="palette"
                :show-actions="false"
                @open="openPalette(palette)"
              />
            </div>

            <p v-else-if="sortedBookmarks.length === 0" class="profile-empty">
              No saved colors yet.
            </p>

            <div v-else class="palettes-grid">
              <ColorBookmarkCard
                v-for="bookmark in sortedBookmarks"
                :key="bookmark.id"
                :bookmark="bookmark"
                :editable="isOwnProfile"
                @edit="openBookmarkEditModal"
                @delete="deleteBookmark"
              />
            </div>
          </section>
        </div>
      </template>
    </section>

    <AuthModal
      v-if="showAuthModal"
      theme="light"
      @authenticated="onProfileAuthSuccess"
      @cancel="showAuthModal = false"
    />

    <ColorBookmarkModal
      :open="bookmarkEditModalOpen"
      :hex="editingBookmark?.hex ?? ''"
      :label="bookmarkEditLabel"
      :existing="true"
      :isSaving="bookmarkEditSaving"
      :error="bookmarkEditError"
      :createdAt="editingBookmark?.created_at ?? null"
      :updatedAt="editingBookmark?.updated_at ?? null"
      @close="closeBookmarkEditModal"
      @save="saveBookmarkEdit"
      @update:label="bookmarkEditLabel = $event"
    />

    <ColorBookmarkDeleteModal
      :open="bookmarkDeleteModalOpen"
      :hex="deletingBookmark?.hex ?? ''"
      :label="deletingBookmark?.label ?? ''"
      :error="bookmarkDeleteError"
      :isDeleting="bookmarkDeleteSaving"
      @close="closeBookmarkDeleteModal"
      @confirm="confirmDeleteBookmark"
    />

    <ColleaguesModal
      :open="showColleaguesModal"
      :viewMode="isOwnProfile ? 'mine' : 'public'"
      :publicUsername="profileUser?.username ?? null"
      removeConfirmMode="modal"
      @close="showColleaguesModal = false"
      @updated="onColleaguesUpdated"
    />

    <Teleport to="body">
      <Transition name="profile-confirm-fade">
        <div v-if="showProfileRemoveConfirm" class="profile-confirm-overlay" @click.self="showProfileRemoveConfirm = false">
          <div class="profile-confirm-modal">
            <h3 class="profile-confirm-title font-display">Confirm</h3>
            <p class="profile-confirm-text">
              Are you sure you want to {{ secondaryActionLabel.toLowerCase() }}?
            </p>
            <div class="profile-confirm-actions">
              <button class="profile-confirm-btn" :disabled="relationLoading" @click="showProfileRemoveConfirm = false">No</button>
              <button class="profile-confirm-btn profile-confirm-btn--danger" :disabled="relationLoading" @click="confirmRemoveFromProfile">Yes</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ColorBookmarkResponse, FolderResponse, PaletteCache, UserGetResponse } from '@/api/types'
import { authApi } from '@/api'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import { usersApi } from '@/api/users'
import { colleaguesApi } from '@/api/colleagues'
import { palettesApi } from '@/api/palettes'
import { foldersApi } from '@/api/folders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import FolderTree from '@/components/folder/FolderTree.vue'
import PaletteCard from '@/components/palette/PaletteCard.vue'
import ColorBookmarkCard from '@/components/bookmarks/ColorBookmarkCard.vue'
import ColorBookmarkDeleteModal from '@/components/bookmarks/ColorBookmarkDeleteModal.vue'
import AuthModal from '@/components/auth/AuthModal.vue'
import ColorBookmarkModal from '@/views/color/components/ColorBookmarkModal.vue'
import ColleaguesModal from '@/components/colleagues/ColleaguesModal.vue'
import type { ColleagueRelationStatus } from '@/api/types'
import IconUsers from '@/components/icons/IconUsers.vue'
import IconClock3 from '@/components/icons/IconClock3.vue'
import IconMail from '@/components/icons/IconMail.vue'
import { setPageSeo } from '@/utils/seo'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMessage = ref('')
const viewerUser = ref<any>(null)
const profileUser = ref<UserGetResponse | null>(null)
const palettes = ref<PaletteCache[]>([])
const folders = ref<FolderResponse[]>([])
const bookmarks = ref<ColorBookmarkResponse[]>([])
const activeFolderKey = ref<'all' | 'root' | number>('all')
const contentMode = ref<'palettes' | 'bookmarks'>('palettes')
const editingBookmark = ref<ColorBookmarkResponse | null>(null)
const bookmarkEditModalOpen = ref(false)
const bookmarkEditLabel = ref('')
const bookmarkEditError = ref('')
const bookmarkEditSaving = ref(false)
const bookmarkDeleteModalOpen = ref(false)
const deletingBookmark = ref<ColorBookmarkResponse | null>(null)
const bookmarkDeleteError = ref('')
const bookmarkDeleteSaving = ref(false)
const relationStatus = ref<ColleagueRelationStatus>('none')
const relationLoading = ref(false)
const showAuthModal = ref(false)
const showColleaguesModal = ref(false)
const pendingAddAfterAuth = ref(false)
const showProfileRemoveConfirm = ref(false)

const profileUsername = computed(() => String(route.params.username ?? '').trim())
const isOwnProfile = computed(() => !!viewerUser.value?.username && viewerUser.value.username === profileUsername.value)

const fullName = computed(() => {
  const name = [profileUser.value?.firstname, profileUser.value?.lastname].filter(Boolean).join(' ')
  return name || 'No public full name'
})

const folderCounts = computed(() => {
  const counts: Record<number, number> = {}
  for (const palette of palettes.value) {
    if (palette.folder_id == null) continue
    counts[palette.folder_id] = (counts[palette.folder_id] ?? 0) + 1
  }
  return counts
})

const rootPaletteCount = computed(() => palettes.value.filter(p => p.folder_id == null).length)
const palettesSubtitle = computed(() => {
  if (activeFolderKey.value === 'all') return 'All palettes'
  if (activeFolderKey.value === 'root') return '/'
  const ancestors = getFolderAncestors(activeFolderKey.value)
  const labels = ancestors
    .map(id => folders.value.find(f => f.id === id)?.name ?? '')
    .filter(Boolean)
  return labels.length ? `/ ${labels.join(' / ')}` : '/'
})
const bookmarksSubtitle = computed(() => `${bookmarks.value.length} saved`)

const filteredPalettes = computed(() => {
  let list: PaletteCache[]
  if (activeFolderKey.value === 'all') {
    list = [...palettes.value]
  } else if (activeFolderKey.value === 'root') {
    list = palettes.value.filter(p => p.folder_id == null)
  } else {
    list = palettes.value.filter(p => p.folder_id === activeFolderKey.value)
  }

  list.sort((a, b) => {
    const da = new Date(a.last_snapshot_at ?? a.created_at).getTime()
    const db = new Date(b.last_snapshot_at ?? b.created_at).getTime()
    return db - da
  })
  return list
})

const sortedBookmarks = computed(() => {
  const list = [...bookmarks.value]
  list.sort((a, b) => {
    const da = new Date(a.created_at).getTime()
    const db = new Date(b.created_at).getTime()
    return db - da
  })
  return list
})

const relationPrimaryLabel = computed(() => {
  if (!viewerUser.value) return 'Add colleague'
  if (relationStatus.value === 'accepted') return 'Colleague'
  if (relationStatus.value === 'pending_outgoing') return 'Request sent'
  if (relationStatus.value === 'pending_incoming') return 'Accept request'
  return 'Add colleague'
})

const showSecondaryAction = computed(() => {
  return relationStatus.value === 'accepted' || relationStatus.value === 'pending_outgoing' || relationStatus.value === 'pending_incoming'
})

const secondaryActionLabel = computed(() => {
  if (relationStatus.value === 'accepted') return 'Remove'
  if (relationStatus.value === 'pending_outgoing') return 'Remove request'
  return 'Deny'
})

const colleaguesCountLabel = computed(() => {
  const count = Number(profileUser.value?.colleagues_count ?? 0)
  return `${count} ${count === 1 ? 'Colleague' : 'Colleagues'}`
})

function syncProfilePageTitle(): void {
  const username = profileUser.value?.username || profileUsername.value
  if (loading.value && username) {
    setPageSeo({
      title: `@${username} - RGBAST`,
      description: `Loading RGBAST profile @${username} with public palettes, saved colors, and folder organization.`,
      keywords: ['profile', 'user palettes', 'saved colors', username, 'RGBAST user'],
    })
    return
  }
  if (profileUser.value) {
    const fullNamePart = [profileUser.value.firstname, profileUser.value.lastname].filter(Boolean).join(' ')
    setPageSeo({
      title: `@${profileUser.value.username} - RGBAST`,
      description: `View ${profileUser.value.username}'s RGBAST profile${fullNamePart ? ` (${fullNamePart})` : ''} and browse public palettes and saved colors.`,
      keywords: ['profile', 'public palettes', 'saved colors', profileUser.value.username, fullNamePart],
    })
    return
  }
  if (errorMessage.value && username) {
    setPageSeo({
      title: `Profile ${username} - RGBAST`,
      description: `Profile page for ${username} on RGBAST.`,
      keywords: ['profile', username, 'RGBAST'],
    })
    return
  }
  setPageSeo({
    title: 'Profile - RGBAST',
    description: 'Browse RGBAST designer profiles and their public palettes.',
    keywords: ['designer profile', 'palette profile', 'RGBAST'],
  })
}

async function loadViewerUser() {
  const token = localStorage.getItem('access_token')
  if (!token) {
    viewerUser.value = null
    return
  }
  try {
    viewerUser.value = await authApi.checkAuth()
  } catch {
    viewerUser.value = null
    localStorage.removeItem('access_token')
  }
}

async function loadRelationStatus() {
  if (!viewerUser.value || !profileUser.value || isOwnProfile.value) {
    relationStatus.value = isOwnProfile.value ? 'self' : 'none'
    return
  }
  try {
    const resp = await colleaguesApi.getStatus(profileUser.value.username)
    relationStatus.value = resp.status
  } catch {
    relationStatus.value = 'none'
  }
}

async function loadProfile() {
  const username = profileUsername.value
  if (!username) {
    errorMessage.value = 'Missing username.'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''
  activeFolderKey.value = 'all'
  contentMode.value = 'palettes'
  try {
    const [userResp, palettesResp, foldersResp, bookmarksResp] = await Promise.all([
      usersApi.getByUsername(username),
      palettesApi.getByUsername(username),
      foldersApi.getByUsername(username),
      colorBookmarksApi.getByUsername(username),
    ])
    profileUser.value = userResp
    palettes.value = palettesResp.palettes.map((palette) => {
      const cached: PaletteCache = {
        id: palette.id,
        title: palette.title,
        description: palette.description,
        folder_id: palette.folder_id ?? null,
        folder_path: palette.folder_path ?? [],
        created_at: palette.created_at,
        last_snapshot_at: palette.latest_main_snapshot?.created_at,
        palette_colors: palette.latest_main_snapshot?.palette_colors ?? [],
      }
      palettesApi.cachePalette(cached)
      return cached
    })
    folders.value = foldersResp
    bookmarks.value = bookmarksResp.bookmarks
  } catch (error: any) {
    profileUser.value = null
    palettes.value = []
    folders.value = []
    bookmarks.value = []
    errorMessage.value = error?.message ?? 'Could not load this profile.'
  } finally {
    loading.value = false
  }
  await loadRelationStatus()
}

function openPalette(palette: PaletteCache) {
  if (!profileUser.value) return
  const path = [...(palette.folder_path ?? []), palette.title].filter(Boolean).join('/')
  router.push({ name: 'palette', params: { username: profileUser.value.username, pathMatch: path } })
}

function getFolderAncestors(folderId: number): number[] {
  const path: number[] = []
  let id: number | null = folderId
  while (id != null) {
    path.unshift(id)
    const folder = folders.value.find(f => f.id === id)
    id = folder?.parent_folder_id ?? null
  }
  return path
}

function openBookmarkEditModal(bookmark: ColorBookmarkResponse): void {
  if (!isOwnProfile.value) return
  editingBookmark.value = bookmark
  bookmarkEditLabel.value = bookmark.label
  bookmarkEditError.value = ''
  bookmarkEditModalOpen.value = true
}

function closeBookmarkEditModal(): void {
  bookmarkEditModalOpen.value = false
  editingBookmark.value = null
  bookmarkEditError.value = ''
}

async function saveBookmarkEdit(): Promise<void> {
  if (!editingBookmark.value || !bookmarkEditLabel.value.trim()) return
  bookmarkEditSaving.value = true
  bookmarkEditError.value = ''
  try {
    const updated = await colorBookmarksApi.upsert(editingBookmark.value.hex, { label: bookmarkEditLabel.value.trim() })
    const index = bookmarks.value.findIndex(bookmark => bookmark.id === updated.id)
    if (index !== -1) {
      bookmarks.value[index] = updated
    }
    editingBookmark.value = updated
    bookmarkEditLabel.value = updated.label
    bookmarkEditModalOpen.value = false
  } catch (error: any) {
    bookmarkEditError.value = error?.message ?? 'Could not update bookmark.'
  } finally {
    bookmarkEditSaving.value = false
  }
}

function deleteBookmark(bookmark: ColorBookmarkResponse): void {
  if (!isOwnProfile.value) return
  deletingBookmark.value = bookmark
  bookmarkDeleteError.value = ''
  bookmarkDeleteModalOpen.value = true
}

function closeBookmarkDeleteModal(): void {
  bookmarkDeleteModalOpen.value = false
  deletingBookmark.value = null
  bookmarkDeleteError.value = ''
}

async function confirmDeleteBookmark(): Promise<void> {
  if (!isOwnProfile.value || !deletingBookmark.value) return
  bookmarkDeleteSaving.value = true
  bookmarkDeleteError.value = ''
  try {
    await colorBookmarksApi.delete(deletingBookmark.value.hex)
    bookmarks.value = bookmarks.value.filter(entry => entry.id !== deletingBookmark.value?.id)
    if (editingBookmark.value?.id === deletingBookmark.value.id) {
      closeBookmarkEditModal()
    }
    closeBookmarkDeleteModal()
  } catch (error: any) {
    bookmarkDeleteError.value = error?.message ?? 'Could not delete bookmark.'
  } finally {
    bookmarkDeleteSaving.value = false
  }
}

onMounted(async () => {
  window.addEventListener('rgbast:colleagues-updated', onColleaguesUpdatedEvent)
  await loadViewerUser()
  await loadProfile()
})

onBeforeUnmount(() => {
  window.removeEventListener('rgbast:colleagues-updated', onColleaguesUpdatedEvent)
})

watch(
  () => route.params.username,
  async () => {
    await loadProfile()
  },
)

watch(
  [loading, errorMessage, profileUser, profileUsername],
  () => {
    syncProfilePageTitle()
  },
  { immediate: true },
)

async function onPrimaryColleagueAction(): Promise<void> {
  if (isOwnProfile.value || !profileUser.value) return
  if (!viewerUser.value) {
    pendingAddAfterAuth.value = true
    showAuthModal.value = true
    return
  }
  relationLoading.value = true
  try {
    if (relationStatus.value === 'pending_incoming') {
      await colleaguesApi.accept(profileUser.value.username)
      relationStatus.value = 'accepted'
      profileUser.value.colleagues_count = Number(profileUser.value.colleagues_count ?? 0) + 1
    } else if (relationStatus.value === 'none') {
      const resp = await colleaguesApi.addOrAccept(profileUser.value.username)
      relationStatus.value = resp.status === 'accepted' ? 'accepted' : 'pending_outgoing'
      if (resp.status === 'accepted') {
        profileUser.value.colleagues_count = Number(profileUser.value.colleagues_count ?? 0) + 1
      }
    }
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
  } finally {
    relationLoading.value = false
  }
}

async function onSecondaryColleagueAction(): Promise<void> {
  if (!profileUser.value || !viewerUser.value) return
  if (!showSecondaryAction.value) return
  relationLoading.value = true
  try {
    await colleaguesApi.remove(profileUser.value.username)
    if (relationStatus.value === 'accepted') {
      profileUser.value.colleagues_count = Math.max(0, Number(profileUser.value.colleagues_count ?? 0) - 1)
    }
    relationStatus.value = 'none'
    window.dispatchEvent(new Event('rgbast:colleagues-updated'))
  } finally {
    relationLoading.value = false
  }
}

function onRemoveCrossClick(): void {
  if (!showSecondaryAction.value) return
  showProfileRemoveConfirm.value = true
}

async function confirmRemoveFromProfile(): Promise<void> {
  showProfileRemoveConfirm.value = false
  await onSecondaryColleagueAction()
}

async function onProfileAuthSuccess(): Promise<void> {
  showAuthModal.value = false
  await loadViewerUser()
  await loadRelationStatus()
  if (pendingAddAfterAuth.value) {
    pendingAddAfterAuth.value = false
    await onPrimaryColleagueAction()
  }
}

function onColleaguesClick(): void {
  if (isOwnProfile.value && !viewerUser.value) {
    showAuthModal.value = true
    return
  }
  showColleaguesModal.value = true
}

function onColleaguesUpdated(): void {
  void refreshOwnProfileColleaguesCount()
  void loadRelationStatus()
}

async function refreshOwnProfileColleaguesCount(): Promise<void> {
  if (!profileUser.value || !viewerUser.value || !isOwnProfile.value) return
  try {
    const payload = await colleaguesApi.listMine()
    profileUser.value.colleagues_count = payload.colleagues.length
  } catch {}
}

function onColleaguesUpdatedEvent(): void {
  void refreshOwnProfileColleaguesCount()
  void loadRelationStatus()
}
</script>

<style scoped src="./ProfileView.css"></style>
