<template>
  <div class="app-loader">
    <div class="spinner-ring">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 309.25 290.5"
        class="logo-spin"
        aria-hidden="true"
      >
        <path fill="#b410cc" d="M249.81,94c0,.41,0,.82,0,1.22a106.89,106.89,0,0,0-95.16,13.16A106.89,106.89,0,0,0,61.82,94.45c0-.15,0-.3,0-.45a94,94,0,0,1,188,0Z"/>
        <path fill="#b410cc" d="M110.19,176.17a94.25,94.25,0,0,1-47.37-68.35,93.89,93.89,0,0,1,81.06,9A106.94,106.94,0,0,0,110.19,176.17Z"/>
        <path fill="#b410cc" d="M187,182.68a94,94,0,0,1-64.6-.82,94,94,0,0,1,32.23-57.14A94,94,0,0,1,187,182.68Z"/>
        <path fill="#b410cc" d="M215.25,102.5a93.41,93.41,0,0,1,33.42,6.14,94.24,94.24,0,0,1-49.39,68.69,106.94,106.94,0,0,0-33.9-60.47A93.33,93.33,0,0,1,215.25,102.5Z"/>
        <path fill="#b410cc" d="M155.81,188a93.41,93.41,0,0,1-33.42-6.14,94,94,0,0,1,32.23-57.14,94,94,0,0,1,32.37,58A93.36,93.36,0,0,1,155.81,188Z"/>
        <path fill="#d56a88" d="M215.25,102.5a93.41,93.41,0,0,1,33.42,6.14,94.24,94.24,0,0,1-49.39,68.69,106.94,106.94,0,0,0-33.9-60.47A93.33,93.33,0,0,1,215.25,102.5Z"/>
        <path fill="#b410cc" d="M188,196.5a93.82,93.82,0,0,1-33.38,71.78,93.83,93.83,0,0,1-33.37-71.78c0-.41,0-.82,0-1.22a107.11,107.11,0,0,0,66.72.77C188,196.2,188,196.35,188,196.5Z"/>
        <path fill="#f6c343" d="M309.25,196.5a93.95,93.95,0,0,1-143.87,79.64A106.75,106.75,0,0,0,201,196.5c0-1.83-.05-3.65-.14-5.46a107.34,107.34,0,0,0,60-76.71A94.08,94.08,0,0,1,309.25,196.5Z"/>
        <path fill="#616bd0" d="M110.19,176.17a94.25,94.25,0,0,1-47.37-68.35,93.89,93.89,0,0,1,81.06,9A106.94,106.94,0,0,0,110.19,176.17Z"/>
        <path fill="#0e0e10" d="M155.81,188a93.41,93.41,0,0,1-33.42-6.14,94,94,0,0,1,32.23-57.14,94,94,0,0,1,32.37,58A93.36,93.36,0,0,1,155.81,188Z"/>
        <path fill="#0ec6d4" d="M108.46,189.93q-.21,3.25-.21,6.57a106.7,106.7,0,0,0,35.63,79.64,94,94,0,1,1-93.35-163A107.33,107.33,0,0,0,108.46,189.93Z"/>
        <path fill="#82c58c" d="M188,196.5a93.82,93.82,0,0,1-33.38,71.78,93.83,93.83,0,0,1-33.37-71.78c0-.41,0-.82,0-1.22a107.11,107.11,0,0,0,66.72.77C188,196.2,188,196.35,188,196.5Z"/>
      </svg>
    </div>
    <p class="loader-msg">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
/** Full-screen loading state. Displays the RGBAST logo spinning in 3×120° steps
 *  with brief pauses between segments. message prop customizes the subtitle. */
withDefaults(defineProps<{ message?: string }>(), { message: 'Loading…' })
</script>

<style scoped>
.app-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
}

.spinner-ring {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-spin {
  width: 42px;
  height: auto;
  animation: spin3parts 2s infinite;
  transform-origin: center;
}

@keyframes spin3parts {
  0%   { transform: rotate(0deg);   animation-timing-function: linear; }
  6%   { transform: rotate(0deg);   animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  33%  { transform: rotate(120deg); animation-timing-function: linear; }
  40%  { transform: rotate(120deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  66%  { transform: rotate(240deg); animation-timing-function: linear; }
  73%  { transform: rotate(240deg); animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
  100% { transform: rotate(360deg); }
}

.loader-msg {
  font-size: 13px;
  color: rgba(255,255,255,0.35);
  font-family: 'Sora', sans-serif;
  letter-spacing: 0.04em;
}
</style>
