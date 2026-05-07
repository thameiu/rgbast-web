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
          </div>
        </header>

        <div class="profile-content">
          <aside class="profile-folders">
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
            <div class="section-bar">
              <h2 class="section-title font-display">Palettes</h2>
              <p class="breadcrumb-all font-mono">{{ palettesSubtitle }}</p>
            </div>

            <p v-if="filteredPalettes.length === 0" class="profile-empty">
              No palettes in this folder.
            </p>

            <div v-else class="palettes-grid">
              <PaletteCard
                v-for="palette in filteredPalettes"
                :key="palette.id"
                :palette="palette"
                :show-actions="false"
                @open="openPalette(palette)"
              />
            </div>
          </section>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FolderResponse, PaletteCache, UserGetResponse } from '@/api/types'
import { authApi } from '@/api'
import { usersApi } from '@/api/users'
import { palettesApi } from '@/api/palettes'
import { foldersApi } from '@/api/folders'
import SiteHeader from '@/components/layout/SiteHeader.vue'
import AppLoader from '@/components/ui/AppLoader.vue'
import FolderTree from '@/components/folder/FolderTree.vue'
import PaletteCard from '@/components/palette/PaletteCard.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const errorMessage = ref('')
const viewerUser = ref<any>(null)
const profileUser = ref<UserGetResponse | null>(null)
const palettes = ref<PaletteCache[]>([])
const folders = ref<FolderResponse[]>([])
const activeFolderKey = ref<'all' | 'root' | number>('all')

const profileUsername = computed(() => String(route.params.username ?? '').trim())

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
  try {
    const [userResp, palettesResp, foldersResp] = await Promise.all([
      usersApi.getByUsername(username),
      palettesApi.getByUsername(username),
      foldersApi.getByUsername(username),
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
  } catch (error: any) {
    profileUser.value = null
    palettes.value = []
    folders.value = []
    errorMessage.value = error?.message ?? 'Could not load this profile.'
  } finally {
    loading.value = false
  }
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

onMounted(async () => {
  await loadViewerUser()
  await loadProfile()
})

watch(
  () => route.params.username,
  async () => {
    await loadProfile()
  },
)
</script>

<style scoped src="./ProfileView.css"></style>
