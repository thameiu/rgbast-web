<template>
  <section class="bookmarks-view" :class="{ embedded }">
    <SiteHeader v-if="!embedded" :user="viewerUser" :brand-meta="t('bookmarksPage.brand')" />

    <section class="bookmarks-shell">
      <ContentSkeleton v-if="loading" :message="t('bookmarksPage.loading')" />

      <div v-else class="bookmarks-content">
        <header class="bookmarks-head">

          <h1 v-if="!embedded" class="content-title font-display">Atelier</h1>
          <AtelierTabs v-if="!embedded" />
          <input v-model="localQuery" class="atelier-search" :placeholder="t('bookmarksPage.search')" :aria-label="t('bookmarksPage.search')" />
          <div v-if="canAdd" class="bookmark-actions"><button class="new-bookmark-btn" @click="openNewBookmark">{{ t('common.new') }} <AppIcon name="plus" :size="12" /></button></div>
        </header>

        <div class="bookmarks-section">
          <div class="sort-bar font-mono">
            <span class="sort-label">{{ t('common.sort') }}</span>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'name' }"
              @click="sortField === 'name' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'name', sortDir = 'asc')"
            >
              {{ t('common.name') }}
              <svg v-if="sortField === 'name'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button
              class="sort-btn"
              :class="{ 'sort-btn--active': sortField === 'date' }"
              @click="sortField === 'date' ? sortDir = sortDir === 'asc' ? 'desc' : 'asc' : (sortField = 'date', sortDir = 'desc')"
            >
              {{ t('common.lastEdit') }}
              <svg v-if="sortField === 'date'" class="sort-arrow" :class="{ 'sort-arrow--down': sortDir === 'desc' }" width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1.5v6M1.5 4.5l3-3 3 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>

          <p v-if="errorMessage" class="bookmarks-error">{{ errorMessage }}</p>
          <AtelierEmptyState v-else-if="sortedBookmarks.length === 0" icon="bookmark" :message="t('bookmarksPage.empty')" />

          <div v-else class="bookmarks-grid">
            <ColorBookmarkCard
              v-for="bookmark in sortedBookmarks"
              :key="bookmark.id"
              :bookmark="bookmark"
              :canEdit="canEdit"
              :canDelete="canDelete"
              @edit="openEditModal"
              @delete="deleteBookmark"
            />
          </div>
        </div>
      </div>
    </section>

    <ColorBookmarkModal
      :open="editModalOpen"
      :hex="bookmarkHex"
      :label="editLabel"
      :existing="!!editingBookmark"
      :allowCreate="creatingBookmark"
      :bookmarkId="editingBookmark?.id"
      :initialProjectId="projectId"
      :isSaving="isSavingEdit"
      :error="editError"
      :createdAt="editingBookmark?.created_at ?? null"
      :updatedAt="editingBookmark?.updated_at ?? null"
      @close="closeEditModal"
      @save="saveEdit"
      @update:label="editLabel = $event; labelTouched = true"
    ><template v-if="creatingBookmark" #picker><ClassicColorPicker inline hide-adjustments :model-value="bookmarkHex" @update:model-value="bookmarkHex=$event" /></template></ColorBookmarkModal>

    <ColorBookmarkDeleteModal
      :open="deleteModalOpen"
      :hex="deletingBookmark?.hex ?? ''"
      :label="deletingBookmark?.label ?? ''"
      :error="deleteError"
      :isDeleting="isDeletingBookmark"
      @close="closeDeleteModal"
      @confirm="confirmDeleteBookmark"
    />
  </section>
</template>

<script setup lang="ts">
import AppIcon from '@/components/icons/AppIcon.vue'
import AtelierEmptyState from '@/components/ui/AtelierEmptyState.vue'
const props = defineProps<{ embedded?: boolean; projectId?: number; permissions?: string[] }>()
const canAdd = computed(() => props.projectId == null || !!props.permissions?.includes('add_bookmarks'))
const canEdit = computed(() => props.projectId == null || !!props.permissions?.includes('edit_bookmarks'))
const canDelete = computed(() => props.projectId == null || !!props.permissions?.includes('remove_bookmarks'))
const emit = defineEmits<{ count: [value: number] }>()
import AtelierTabs from '@/components/layout/AtelierTabs.vue'
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ClassicColorPicker from '@/components/palette/ColorPicker.vue'
import {colorApi} from '@/api/color'

import { authApi } from '@/api'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import type { ColorBookmarkResponse, UserMeResponse } from '@/api/types'
import ColorBookmarkDeleteModal from '@/components/bookmarks/ColorBookmarkDeleteModal.vue'
import ColorBookmarkModal from '@/views/color/components/ColorBookmarkModal.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import ContentSkeleton from '@/components/ui/ContentSkeleton.vue'
import ColorBookmarkCard from '@/components/bookmarks/ColorBookmarkCard.vue'
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'

const viewerUser = ref<UserMeResponse | null>(null)
const { t } = useI18n()
const bookmarks = ref<ColorBookmarkResponse[]>([])
watch(() => bookmarks.value.length, count => emit('count', count))
const loading = ref(true)
const errorMessage = ref('')
const sortField = ref<'name' | 'date'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const editModalOpen = ref(false)
const creatingBookmark = ref(false)
const bookmarkHex = ref('B410CC')
const labelTouched = ref(false)
const editingBookmark = ref<ColorBookmarkResponse | null>(null)
const editLabel = ref('')
const editError = ref('')
const isSavingEdit = ref(false)
const deleteModalOpen = ref(false)
const deletingBookmark = ref<ColorBookmarkResponse | null>(null)
const deleteError = ref('')
const isDeletingBookmark = ref(false)

const localQuery = ref('')
const sortedBookmarks = computed(() => {
  const list = bookmarks.value.filter(b => b.label.toLocaleLowerCase().includes(localQuery.value.trim().toLocaleLowerCase()))
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    if (sortField.value === 'name') {
      return dir * a.label.localeCompare(b.label)
    }
    const da = new Date(a.updated_at).getTime()
    const db = new Date(b.updated_at).getTime()
    return dir * (da - db)
  })
  return list
})

async function loadBookmarksPage(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const [user, response] = await Promise.all([
      localStorage.getItem('access_token') ? authApi.checkAuth() : Promise.resolve(null),
      colorBookmarksApi.listMine(undefined, props.projectId),
    ])
    viewerUser.value = user
    bookmarks.value = response.bookmarks
  } catch (error: any) {
    errorMessage.value = error?.message ?? t('bookmarksPage.couldNotLoad')
    bookmarks.value = []
  } finally {
    loading.value = false
  }
}
function refreshProjectContent() { void loadBookmarksPage() }
onMounted(() => window.addEventListener('rgbast:project-content-updated', refreshProjectContent))
onBeforeUnmount(() => window.removeEventListener('rgbast:project-content-updated', refreshProjectContent))

function openNewBookmark(){creatingBookmark.value=true;labelTouched.value=false;editError.value='';editModalOpen.value=true;void loadBookmarkLabel(bookmarkHex.value)}
let labelRequest=0
async function loadBookmarkLabel(hex:string){
  const request=++labelRequest
  editingBookmark.value=null
  editLabel.value=hex
  try{const info=await colorApi.getColorInfo(hex);if(request===labelRequest&&!labelTouched.value&&editModalOpen.value)editLabel.value=info.closest_name||hex}catch{}
}
watch(bookmarkHex,(hex,_,onCleanup)=>{if(!creatingBookmark.value||!editModalOpen.value)return;labelRequest++;labelTouched.value=false;const timer=setTimeout(()=>void loadBookmarkLabel(hex),180);onCleanup(()=>clearTimeout(timer))})
function openEditModal(bookmark: ColorBookmarkResponse): void {
  creatingBookmark.value=false
  bookmarkHex.value=bookmark.hex
  editingBookmark.value = bookmark
  editLabel.value = bookmark.label
  editError.value = ''
  editModalOpen.value = true
}

function closeEditModal(): void {
  editModalOpen.value = false
  editingBookmark.value = null
  editError.value = ''
}

async function saveEdit(selection: { id: number | null; project_id: number | null }): Promise<void> {
  if (!editLabel.value.trim()) return
  isSavingEdit.value = true
  editError.value = ''
  try {
    const targetId = creatingBookmark.value ? selection.id : editingBookmark.value?.id
    const updated = targetId != null
      ? await colorBookmarksApi.update(targetId, { label: editLabel.value.trim() })
      : await colorBookmarksApi.create(bookmarkHex.value, { label: editLabel.value.trim() }, selection.project_id)
    if (updated.project_id !== (props.projectId ?? null)) {
      editModalOpen.value = false
      return
    }
    const index = bookmarks.value.findIndex(bookmark => bookmark.id === updated.id)
    if (index !== -1) {
      bookmarks.value[index] = updated
    } else bookmarks.value.unshift(updated)
    editingBookmark.value = updated
    editLabel.value = updated.label
    editModalOpen.value = false
  } catch (error: any) {
    editError.value = error?.message ?? t('bookmarksPage.couldNotUpdate')
  } finally {
    isSavingEdit.value = false
  }
}

function deleteBookmark(bookmark: ColorBookmarkResponse): void {
  deletingBookmark.value = bookmark
  deleteError.value = ''
  deleteModalOpen.value = true
}

function closeDeleteModal(): void {
  deleteModalOpen.value = false
  deletingBookmark.value = null
  deleteError.value = ''
}

async function confirmDeleteBookmark(): Promise<void> {
  if (!deletingBookmark.value) return
  isDeletingBookmark.value = true
  deleteError.value = ''
  try {
    await colorBookmarksApi.delete(deletingBookmark.value.id)
    bookmarks.value = bookmarks.value.filter(entry => entry.id !== deletingBookmark.value?.id)
    if (editingBookmark.value?.id === deletingBookmark.value.id) {
      closeEditModal()
    }
    closeDeleteModal()
  } catch (error: any) {
    deleteError.value = error?.message ?? t('bookmarksPage.couldNotDelete')
  } finally {
    isDeletingBookmark.value = false
  }
}

onMounted(async () => {
  if (!props.embedded) setPageSeo({
    title: 'Bookmarks - RGBAST',
    description: 'Review and revisit saved color bookmarks in RGBAST.',
    keywords: ['bookmarks', 'saved colors', 'favorite colors', 'RGBAST'],
  })
  await loadBookmarksPage()
})
</script>

<style scoped src="./BookmarksView.css"></style>
