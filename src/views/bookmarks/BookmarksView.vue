<template>
  <section class="bookmarks-view" :class="{ embedded }">
    <SiteHeader v-if="!embedded" :user="viewerUser" :brand-meta="t('bookmarksPage.brand')" />

    <section class="bookmarks-shell">
      <ContentSkeleton v-if="loading" :message="t('bookmarksPage.loading')" />

      <div v-else class="bookmarks-content">
        <header class="bookmarks-head">

          <h1 v-if="!embedded" class="content-title font-display">Atelier</h1>
          <AtelierTabs v-if="!embedded" />
          <input v-model="localQuery" class="atelier-search" :placeholder="t('common.search')" :aria-label="t('common.search')" />
          <div class="bookmark-actions"><button class="new-bookmark-btn" @click="openNewBookmark">{{ t('common.new') }} <AppIcon name="plus" :size="12" /></button></div>
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
          <div v-else-if="sortedBookmarks.length === 0" class="empty-state">
            <AppIcon class="empty-icon" name="bookmark" :size="36" />
            <p>{{ t('bookmarksPage.empty') }}</p>
          </div>

          <div v-else class="bookmarks-grid">
            <ColorBookmarkCard
              v-for="bookmark in sortedBookmarks"
              :key="bookmark.id"
              :bookmark="bookmark"
              editable
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
defineProps<{ embedded?: boolean }>()
const emit = defineEmits<{ count: [value: number] }>()
import AtelierTabs from '@/components/layout/AtelierTabs.vue'
import { computed, onMounted, ref, watch } from 'vue'
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
      authApi.checkAuth(),
      colorBookmarksApi.listMine(),
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

function openNewBookmark(){creatingBookmark.value=true;labelTouched.value=false;editError.value='';editModalOpen.value=true;void loadBookmarkLabel(bookmarkHex.value)}
let labelRequest=0
async function loadBookmarkLabel(hex:string){
  const request=++labelRequest
  const existing=bookmarks.value.find(b=>b.hex.replace('#','').toUpperCase()===hex)
  editingBookmark.value=existing??null
  if(existing){editLabel.value=existing.label;return}
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

async function saveEdit(): Promise<void> {
  if (!editLabel.value.trim()) return
  isSavingEdit.value = true
  editError.value = ''
  try {
    const updated = await colorBookmarksApi.upsert(bookmarkHex.value, { label: editLabel.value.trim() })
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
    await colorBookmarksApi.delete(deletingBookmark.value.hex)
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
  setPageSeo({
    title: 'Bookmarks - RGBAST',
    description: 'Review and revisit saved color bookmarks in RGBAST.',
    keywords: ['bookmarks', 'saved colors', 'favorite colors', 'RGBAST'],
  })
  await loadBookmarksPage()
})
</script>

<style scoped src="./BookmarksView.css"></style>
