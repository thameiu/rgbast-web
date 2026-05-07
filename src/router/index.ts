import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '@/views/landing/LandingView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import PaletteView from '@/views/palette/PaletteView.vue'
import ColorView from '@/views/color/ColorView.vue'
import ProfileView from '@/views/profile/ProfileView.vue'
import SearchView from '@/views/search/SearchView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/users/:username',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/users/:username/:pathMatch(.*)*',
      name: 'palette',
      component: PaletteView,
    },
    {
      path: '/color/:hex',
      name: 'color',
      component: ColorView,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.meta.guestOnly && token) {
    return '/dashboard'
  }

  return true
})

export default router
