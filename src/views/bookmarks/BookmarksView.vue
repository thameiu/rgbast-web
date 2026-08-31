<template>
  <main class="bookmarks-view">
    <SiteHeader :user="viewerUser" :brand-meta="t('bookmarksPage.brand')" />

    <section class="bookmarks-shell">
      <AppLoader v-if="loading" :message="t('bookmarksPage.loading')" />

      <div v-else class="bookmarks-content">
        <header class="bookmarks-head">
          <p class="eyebrow font-mono">{{ t('bookmarksPage.eyebrow') }}</p>
          <h1 class="content-title font-display">{{ t('bookmarksPage.title') }}</h1>
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
            <div class="empty-icon">◐</div>
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
      :hex="editingBookmark?.hex ?? ''"
      :label="editLabel"
      :existing="true"
      :isSaving="isSavingEdit"
      :error="editError"
      :createdAt="editingBookmark?.created_at ?? null"
      :updatedAt="editingBookmark?.updated_at ?? null"
      @close="closeEditModal"
      @save="saveEdit"
      @update:label="editLabel = $event"
    />

    <ColorBookmarkDeleteModal
      :open="deleteModalOpen"
      :hex="deletingBookmark?.hex ?? ''"
      :label="deletingBookmark?.label ?? ''"
      :error="deleteError"
      :isDeleting="isDeletingBookmark"
      @close="closeDeleteModal"
      @confirm="confirmDeleteBookmark"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { authApi } from '@/api'
import { colorBookmarksApi } from '@/api/colorBookmarks'
import type { ColorBookmarkResponse, UserMeResponse } from '@/api/types'
import ColorBookmarkDeleteModal from '@/components/bookmarks/ColorBookmarkDeleteModal.vue'
import ColorBookmarkModal from '@/views/color/components/ColorBookmarkModal.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import ColorBookmarkCard from '@/components/bookmarks/ColorBookmarkCard.vue'
import { setPageSeo } from '@/utils/seo'
import { useI18n } from '@/i18n'

const viewerUser = ref<UserMeResponse | null>(null)
const { t } = useI18n()
const bookmarks = ref<ColorBookmarkResponse[]>([])
const loading = ref(true)
const errorMessage = ref('')
const sortField = ref<'name' | 'date'>('date')
const sortDir = ref<'asc' | 'desc'>('desc')
const editModalOpen = ref(false)
const editingBookmark = ref<ColorBookmarkResponse | null>(null)
const editLabel = ref('')
const editError = ref('')
const isSavingEdit = ref(false)
const deleteModalOpen = ref(false)
const deletingBookmark = ref<ColorBookmarkResponse | null>(null)
const deleteError = ref('')
const isDeletingBookmark = ref(false)

const sortedBookmarks = computed(() => {
  const list = [...bookmarks.value]
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

function openEditModal(bookmark: ColorBookmarkResponse): void {
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
  if (!editingBookmark.value || !editLabel.value.trim()) return
  isSavingEdit.value = true
  editError.value = ''
  try {
    const updated = await colorBookmarksApi.upsert(editingBookmark.value.hex, { label: editLabel.value.trim() })
    const index = bookmarks.value.findIndex(bookmark => bookmark.id === updated.id)
    if (index !== -1) {
      bookmarks.value[index] = updated
    }
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
