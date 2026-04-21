<template>
  <Teleport to="body">
    <div class="auth-overlay" @click.self="$emit('cancel')">
      <div class="auth-modal">
        <!-- Header -->
        <div class="auth-header">
          <RgbastLogo size="26px" />
          <p class="auth-headline font-display">
            {{ tab === 'login' ? 'Sign in to save' : 'Create account to save' }}
          </p>
          <button class="auth-close" @click="$emit('cancel')">×</button>
        </div>

        <!-- Tab switcher -->
        <div class="auth-tabs">
          <button class="tab-btn" :class="{ active: tab === 'login' }" @click="tab = 'login'">
            Sign in
          </button>
          <button class="tab-btn" :class="{ active: tab === 'register' }" @click="tab = 'register'">
            New account
          </button>
        </div>

        <!-- Login form -->
        <form v-if="tab === 'login'" class="auth-form" @submit.prevent="doLogin">
          <label class="auth-field">
            <span class="auth-label font-mono">Username</span>
            <input v-model="loginForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Password</span>
            <input v-model="loginForm.password" class="auth-input" type="password" required placeholder="••••••••" />
          </label>
          <p v-if="loginError" class="auth-error">{{ loginError }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Signing in…' : 'Sign in' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <!-- Register form -->
        <form v-else class="auth-form" @submit.prevent="doRegister">
          <label class="auth-field">
            <span class="auth-label font-mono">Username</span>
            <input v-model="regForm.username" class="auth-input" type="text" required placeholder="your_username" autofocus />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Email</span>
            <input v-model="regForm.email" class="auth-input" type="email" required placeholder="you@example.com" />
          </label>
          <label class="auth-field">
            <span class="auth-label font-mono">Password</span>
            <input v-model="regForm.password" class="auth-input" type="password" required placeholder="••••••••" />
            <span class="auth-hint font-mono">Uppercase · lowercase · number · symbol · 8+</span>
          </label>
          <p v-if="regError" class="auth-error">{{ regError }}</p>
          <button class="auth-submit" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Creating…' : 'Create account' }}
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi, usersApi } from '@/api'
import RgbastLogo from './RgbastLogo.vue'

const emit = defineEmits<{ authenticated: []; cancel: [] }>()

const tab = ref<'login' | 'register'>('login')
const isSubmitting = ref(false)

const loginForm = ref({ username: '', password: '' })
const loginError = ref('')

const regForm = ref({ username: '', email: '', password: '' })
const regError = ref('')

async function doLogin() {
  isSubmitting.value = true
  loginError.value = ''
  try {
    const resp = await authApi.login({ username: loginForm.value.username, password: loginForm.value.password })
    localStorage.setItem('access_token', resp.access_token)
    emit('authenticated')
  } catch (e: any) {
    loginError.value = e.message ?? 'Login failed.'
  } finally {
    isSubmitting.value = false
  }
}

async function doRegister() {
  isSubmitting.value = true
  regError.value = ''
  try {
    await usersApi.create({
      username: regForm.value.username,
      email: regForm.value.email,
      password: regForm.value.password,
      firstname: null,
      lastname: null,
      birthdate: null,
    })
    const resp = await authApi.login({ username: regForm.value.username, password: regForm.value.password })
    localStorage.setItem('access_token', resp.access_token)
    emit('authenticated')
  } catch (e: any) {
    regError.value = e.message ?? 'Registration failed.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.auth-modal {
  background: #0e0e14;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 18px;
  width: 380px;
  max-width: calc(100vw - 32px);
  padding: 28px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.9);
  animation: slideUp 0.25s cubic-bezier(0.2,0.9,0.2,1);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }

.auth-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.auth-headline {
  flex: 1;
  font-size: 17px;
  font-weight: 900;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: #fff;
}
.auth-close {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 20px;
  cursor: pointer;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px;
  transition: color 0.15s, background 0.15s;
}
.auth-close:hover { color: #fff; background: rgba(255,255,255,0.07); }

.auth-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 22px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 4px;
}
.tab-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: rgba(255,255,255,0.45);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.tab-btn.active {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.auth-form { display: flex; flex-direction: column; gap: 14px; }

.auth-field { display: flex; flex-direction: column; gap: 6px; }
.auth-label {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.4);
}
.auth-input {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 10px 13px;
  color: #fff;
  font-size: 14px;
  font-family: 'Sora', sans-serif;
  outline: none;
  transition: border-color 0.15s;
}
.auth-input::placeholder { color: rgba(255,255,255,0.2); }
.auth-input:focus { border-color: rgba(180,16,204,0.6); }

.auth-hint {
  font-size: 10px;
  color: rgba(255,255,255,0.25);
  letter-spacing: 0.05em;
}
.auth-error {
  font-size: 12.5px;
  color: #ff6b6b;
  padding: 8px 12px;
  background: rgba(255,107,107,0.1);
  border-radius: 7px;
  border: 1px solid rgba(255,107,107,0.2);
}
.auth-submit {
  margin-top: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #b410cc;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.auth-submit:hover:not(:disabled) { background: #9a0db0; }
.auth-submit:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
