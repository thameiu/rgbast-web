<template>
  <div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4 py-12 selection:bg-[#B410CC] selection:text-white">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative overflow-hidden">
      <!-- Decorator element -->
      <div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#B410CC] to-fuchsia-300 opacity-20 rounded-bl-full"></div>

      <div class="text-center mb-8 relative z-10">
        <div class="mx-auto flex items-center justify-center mb-4">
          <div class="w-14 h-14 bg-gradient-to-br from-[#B410CC] to-fuchsia-400 rounded-xl shadow-md flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
        </div>
        <h2 class="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create Account</h2>
        <p class="text-sm text-gray-500 font-medium">Join us to get started</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-5 relative z-10">
        <!-- Error Message -->
        <div v-if="errorMsg" class="p-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium">
          {{ errorMsg }}
        </div>
        
        <!-- Success Message -->
        <div v-if="successMsg" class="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl font-medium flex items-center">
           <svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
           </svg>
          {{ successMsg }}
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
          <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">Email Addrress</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email"
            required
            class="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#B410CC]/20 focus:border-[#B410CC] transition-all"
            placeholder="hello@example.com"
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
           <p class="mt-2 text-xs text-gray-500 leading-relaxed">
             Must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.
           </p>
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-[#B410CC]/30 text-sm font-bold text-white bg-[#B410CC] hover:bg-[#970CAE] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B410CC] disabled:opacity-60 disabled:cursor-not-allowed transition-all mt-6"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>

        <p class="text-center text-sm font-medium text-gray-600 mt-6">
          Already have an account? 
          <a href="#" @click.prevent="$emit('navigate', 'login')" class="text-[#B410CC] hover:text-[#970CAE] hover:underline transition-colors decoration-2 underline-offset-2">Log in here</a>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usersApi } from '@/api';

const emit = defineEmits(['navigate']);

const form = ref({ username: '', email: '', password: '' });
const loading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const handleSubmit = async () => {
  loading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  
  try {
    await usersApi.create({ 
      username: form.value.username,
      email: form.value.email,
      password: form.value.password 
    });
    
    successMsg.value = 'Registration successful! Redirecting...';
    setTimeout(() => {
      emit('navigate', 'login');
    }, 2000);
  } catch (err: any) {
    errorMsg.value = err.message || 'Registration failed.';
  } finally {
    loading.value = false;
  }
};
</script>
