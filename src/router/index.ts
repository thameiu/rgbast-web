import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '@/views/landing/LandingView.vue'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'
import ForgotPasswordView from '@/views/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/auth/ResetPasswordView.vue'
import AuthCompleteView from '@/views/auth/AuthCompleteView.vue'
import DashboardView from '@/views/dashboard/DashboardView.vue'
import PaletteView from '@/views/palette/PaletteView.vue'
import ColorView from '@/views/color/ColorView.vue'
import ProfileView from '@/views/profile/ProfileView.vue'
import SearchView from '@/views/search/SearchView.vue'
import SettingsView from '@/views/settings/SettingsView.vue'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (to.name === from.name && to.fullPath === from.fullPath) return false
    return { ...(savedPosition ?? { top: 0, left: 0 }), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }
  },
  routes: [
    { path: '/about', component: () => import('@/views/AboutView.vue') },
    { path: '/atelier', redirect: '/atelier/palettes' },
    { path: '/dashboard', redirect: '/atelier/palettes' },
    { path: '/bookmarks', redirect: '/atelier/bookmarks' },
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
      path: '/forgot-password',
      name: 'forgot-password',
      component: ForgotPasswordView,
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
    },
    {
      path: '/auth/complete',
      name: 'auth-complete',
      component: AuthCompleteView,
    },
    {
      path: '/atelier/palettes/:folders(.*)*',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/atelier/bookmarks',
      name: 'bookmarks',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true },
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
