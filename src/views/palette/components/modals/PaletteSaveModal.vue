<template>
  <Teleport to="body">
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <h3 class="modal-title font-display">{{ isNewPalette ? 'Create Palette' : 'Save Snapshot' }}</h3>
        <p v-if="!isNewPalette" class="modal-sub">Saving to: <strong>{{ currentBranchName }}</strong></p>

        <template v-if="isNewPalette">
          <label class="field-label">Palette title <span class="required">*</span></label>
          <input
            :value="pendingTitle"
            class="modal-input"
            placeholder="e.g. brand-colors"
            maxlength="50"
            autofocus
            @input="$emit('update:pendingTitle', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('save')"
          />
          <label class="field-label">Description</label>
          <textarea
            :value="pendingDescription"
            class="modal-input modal-textarea"
            placeholder="Short note or usage context"
            maxlength="500"
            rows="3"
            @input="$emit('update:pendingDescription', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
          <label class="field-label">Folder</label>
          <FolderPicker
            :folders="folders"
            :modelValue="pendingFolderId"
            @update:modelValue="$emit('update:pendingFolderId', $event)"
            @createFolder="$emit('createFolder', $event)"
          />
        </template>

        <template v-else-if="selectedSnapshotCtx?.isMain && !isSelectedLatestMainSnapshot">
          <p class="modal-info">Forking from an older main snapshot. You must save to a new branch.</p>
          <label class="field-label">Commit message</label>
          <input
            :value="saveComment"
            class="modal-input"
            placeholder="What changed?"
            maxlength="500"
            autofocus
            @input="$emit('update:saveComment', ($event.target as HTMLInputElement).value)"
          />
          <label class="field-label">New branch name <span class="required">*</span></label>
          <input
            :value="newBranchName"
            class="modal-input"
            placeholder="e.g. dark-variant"
            maxlength="100"
            @input="$emit('update:newBranchName', ($event.target as HTMLInputElement).value)"
            @keydown.enter="$emit('save')"
          />
        </template>

        <template v-else-if="selectedSnapshotCtx && !selectedSnapshotCtx.isMain">
          <p class="modal-info">
            <template v-if="selectedSnapshotCtx.isMerged">
              This snapshot belongs to merged branch <strong>{{ selectedSnapshotCtx.branchTitle }}</strong>.
              You must save to a <strong>new branch</strong> from this point.
            </template>
            <template v-else>
              This snapshot belongs to branch <strong>{{ selectedSnapshotCtx.branchTitle }}</strong>.
              Saving will create a new latest commit in this branch.
            </template>
          </p>
          <label class="field-label">Commit message</label>
          <input
            :value="saveComment"
            class="modal-input"
            placeholder="What changed?"
            maxlength="500"
            autofocus
            @input="$emit('update:saveComment', ($event.target as HTMLInputElement).value)"
            @keydown.enter="selectedSnapshotCtx?.isMerged ? undefined : $emit('save')"
          />
          <template v-if="selectedSnapshotCtx.isMerged">
            <label class="field-label">New branch name <span class="required">*</span></label>
            <input
              :value="newBranchName"
              class="modal-input"
              placeholder="e.g. merged-fix"
              maxlength="100"
              @input="$emit('update:newBranchName', ($event.target as HTMLInputElement).value)"
              @keydown.enter="$emit('save')"
            />
          </template>
        </template>

        <template v-else>
          <label class="field-label">Commit message</label>
          <input
            :value="saveComment"
            class="modal-input"
            placeholder="What changed?"
            maxlength="500"
            autofocus
            @input="$emit('update:saveComment', ($event.target as HTMLInputElement).value)"
            @keydown.enter="!createNewBranch && $emit('save')"
          />

          <label v-if="currentBranchId === null" class="check-row">
            <input
              type="checkbox"
              :checked="createNewBranch"
              @change="$emit('update:createNewBranch', ($event.target as HTMLInputElement).checked)"
            />
            <span>Save as a new branch</span>
          </label>

          <div v-if="createNewBranch && currentBranchId === null" class="field-group">
            <label class="field-label">Branch name</label>
            <input
              :value="newBranchName"
              class="modal-input"
              placeholder="e.g. dark-variant"
              maxlength="100"
              @input="$emit('update:newBranchName', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </template>

        <p v-if="saveError" class="modal-error">{{ saveError }}</p>

        <div class="modal-actions">
          <button class="modal-btn cancel" @click="$emit('close')">Cancel</button>
          <button
            class="modal-btn confirm"
            :disabled="
              isSaving ||
              (isNewPalette ? !pendingTitle.trim() : !saveComment.trim()) ||
              ((((selectedSnapshotCtx?.isMain && !isSelectedLatestMainSnapshot) || selectedSnapshotCtx?.isMerged)) && !newBranchName.trim())
            "
            @click="$emit('save')"
          >
            {{ isSaving ? (isNewPalette ? 'Creating...' : 'Saving...') : (isNewPalette ? 'Create' : 'Save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { FolderResponse } from '@/api/types'
import type { SnapshotContext } from '../../composables/usePaletteContext'
import FolderPicker from '@/components/folder/FolderPicker.vue'

defineProps<{
  open: boolean
  isNewPalette: boolean
  currentBranchId: number | null
  currentBranchName: string
  pendingTitle: string
  pendingDescription: string
  pendingFolderId: number | null
  folders: FolderResponse[]
  saveComment: string
  saveError: string
  createNewBranch: boolean
  newBranchName: string
  isSaving: boolean
  selectedSnapshotCtx: SnapshotContext | null
  isSelectedLatestMainSnapshot: boolean
}>()

// Emits: close, save, field updates for the save flow, and folder creation.
defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
  (e: 'update:pendingTitle', value: string): void
  (e: 'update:pendingDescription', value: string): void
  (e: 'update:pendingFolderId', value: number | null): void
  (e: 'update:saveComment', value: string): void
  (e: 'update:createNewBranch', value: boolean): void
  (e: 'update:newBranchName', value: string): void
  (e: 'createFolder', payload: { name: string; parentId: number | null }): void
}>()
</script>

<style scoped src="./PaletteSaveModal.css"></style>
