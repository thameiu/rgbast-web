<template>
  <div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 selection:bg-[#B410CC] selection:text-white">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
      <!-- Decorator element -->
      <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#B410CC] to-fuchsia-300 opacity-20 rounded-bl-full"></div>

      <div class="text-center mb-8 relative z-10">
        <div class="w-14 h-14 bg-[#B410CC] rounded-xl mx-auto flex items-center justify-center mb-4 shadow-md">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.092 2.027-.267 3.018m-2.54 5.342c-.512.44-1.127.818-1.79.11-2.091-2.22-3.14-5-3.14-8.08V8a4 4 0 118 0v1.5a2.5 2.5 0 01-5 0V8m-3 0a3 3 0 116 0" />
          </svg>
        </div>
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome back</h2>
        <p class="text-sm text-gray-500 font-medium">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5 relative z-10">
        <!-- Error Message -->
        <div v-if="errorMsg" class="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium">
          <p v-for="(line, i) in errorMsg.split('\n')" :key="i">{{ line }}</p>
        </div>

        <div>
          <label for="username" class="block text-sm font-semibold text-gray-700 mb-1">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username"
            required
            class="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#B410CC]/20 focus:border-[#B410CC] transition-all"
            placeholder="johndoe"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password"
            required
            class="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#B410CC]/20 focus:border-[#B410CC] transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#B410CC]/30 text-sm font-bold text-white bg-[#B410CC] hover:bg-[#970CAE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B410CC] disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-6"
        >
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p class="text-center text-sm font-medium text-gray-600 mt-6">
          Don't have an account? 
          <a href="#" @click.prevent="$emit('navigate', 'register')" class="text-[#B410CC] hover:text-[#970CAE] hover:underline transition-colors decoration-2 underline-offset-2">Register here</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { authApi } from '@/api';

const emit = defineEmits(['navigate', 'login-success']);

const form = ref({ username: '', password: '' });
const loading = ref(false);
const errorMsg = ref('');

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const res = await authApi.login({ 
      username: form.value.username, 
      password: form.value.password 
    });
    
    if (res.access_token) {
      localStorage.setItem('access_token', res.access_token);
      emit('login-success');
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};
</script>
