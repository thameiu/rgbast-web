<template>
  <div class="min-h-screen bg-[#FAFAFA] font-sans selection:bg-[#B410CC] selection:text-white">
    <!-- Navbar -->
    <nav class="bg-gradient-to-r from-[#B410CC] to-[#8C0A9E] shadow-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/30 text-white font-bold text-xl leading-none">
              R
            </div>
            <h1 class="text-xl font-extrabold text-white tracking-wide">RGBAST</h1>
          </div>
          <div>
            <div class="flex items-center gap-4">
               <span v-if="user" class="text-white/80 text-sm hidden sm:block font-medium">Hello, {{ user.username }}</span>
               <button 
                 @click="handleLogout"
                 class="px-4 py-2 border border-white/20 text-sm font-semibold rounded-lg text-[#B410CC] bg-white hover:bg-gray-50 focus:outline-none shadow-md transition-all active:scale-95 flex items-center gap-2"
               >
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 Sign out
               </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content Header -->
    <header class="bg-white shadow-sm border-b border-gray-100">
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
         <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
      </div>
    </header>

    <!-- Main Content Body -->
    <main class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
        <div class="p-8">
          
          <div v-if="loading" class="flex flex-col items-center justify-center py-12">
             <div class="w-10 h-10 border-4 border-gray-200 border-t-[#B410CC] rounded-full animate-spin mb-4"></div>
             <p class="text-gray-500 font-medium">Loading your dashboard...</p>
          </div>
          
          <div v-else-if="user" class="space-y-6">
             <div class="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                <div class="w-16 h-16 bg-gradient-to-tr from-[#B410CC] to-purple-300 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md border-4 border-white">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div>
                   <h3 class="text-xl font-bold text-gray-900">Welcome back, <span class="text-[#B410CC]">{{ user.username }}</span></h3>
                   <p class="text-gray-500 font-medium">{{ user.email }}</p>
                </div>
             </div>
             
             <!-- Cards area -->
             <div>
               <h4 class="text-lg font-bold text-gray-900 mb-4 tracking-tight">Your Workspaces</h4>
               <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  
                  <!-- Action Card (Create) -->
                  <div class="group border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-[#B410CC] hover:border-[#B410CC] hover:bg-[#B410CC]/5 transition-all cursor-pointer min-h-[12rem]">
                    <div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-[#B410CC]/10 transition-colors mb-3">
                       <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                       </svg>
                    </div>
                    <span class="font-bold">Create Palette</span>
                  </div>

                  <!-- Example Card 1 -->
                  <div class="border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-[#B410CC]/10 transition-all bg-white group cursor-pointer">
                    <div class="h-28 rounded-xl mb-4 overflow-hidden shadow-inner flex">
                       <div class="flex-1 bg-[#1A1A1D]"></div>
                       <div class="flex-1 bg-[#B410CC]"></div>
                       <div class="flex-1 bg-[#E1R4E7] bg-fuchsia-400"></div>
                       <div class="flex-1 bg-[#FAFAFA]"></div>
                    </div>
                    <div class="flex justify-between items-start">
                       <div>
                          <h3 class="text-md font-bold text-gray-900 group-hover:text-[#B410CC] transition-colors">Neon Nights</h3>
                          <p class="text-xs text-gray-500 font-medium mt-1">Updated 2 days ago</p>
                       </div>
                    </div>
                  </div>

                  <!-- Example Card 2 -->
                  <div class="border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-[#B410CC]/10 transition-all bg-white group cursor-pointer">
                    <div class="h-28 rounded-xl mb-4 overflow-hidden shadow-inner flex">
                       <div class="flex-1 bg-[#2C3E50]"></div>
                       <div class="flex-1 bg-[#E74C3C]"></div>
                       <div class="flex-1 bg-[#ECF0F1]"></div>
                       <div class="flex-1 bg-[#3498DB]"></div>
                    </div>
                    <div class="flex justify-between items-start">
                       <div>
                          <h3 class="text-md font-bold text-gray-900 group-hover:text-[#B410CC] transition-colors">Corporate Ocean</h3>
                          <p class="text-xs text-gray-500 font-medium mt-1">Updated 1 week ago</p>
                       </div>
                    </div>
                  </div>

               </div>
            </div>
          </div>
          
          <div v-else class="text-center py-12 h-64 flex flex-col justify-center items-center">
             <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
             </div>
             <h3 class="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h3>
             <p class="text-gray-500 font-medium">Failed to load user info. Your session might have expired.</p>
             <button @click="handleLogout" class="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Return to Login
             </button>
          </div>

        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authApi } from '@/api';

const emit = defineEmits(['logout']);

const loading = ref(true);
const user = ref<any>(null);

onMounted(async () => {
  try {
    const res = await authApi.checkAuth();
    user.value = res; // Bind API returned user
  } catch (err) {
    console.error('Check auth failed:', err);
    emit('logout'); // Token expired or invalid
  } finally {
    loading.value = false;
  }
});

const handleLogout = () => {
  localStorage.removeItem('access_token');
  emit('logout');
};
</script>
