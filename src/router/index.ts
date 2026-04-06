import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
      },
      {
        path: 'monitoring',
        name: 'Monitoring',
        component: () => import('../views/Monitoring.vue'),
      },
      {
        path: 'nodes',
        name: 'Nodes',
        component: () => import('../views/Nodes.vue'),
      },
      {
        path: 'namespaces',
        name: 'Namespaces',
        component: () => import('../views/Namespaces.vue'),
      },
      {
        path: 'deployments/:namespace?',
        name: 'Deployments',
        component: () => import('../views/Deployments.vue'),
      },
      {
        path: 'pods/:namespace?',
        name: 'Pods',
        component: () => import('../views/Pods.vue'),
      },
      {
        path: 'daemonsets/:namespace?',
        name: 'DaemonSets',
        component: () => import('../views/DaemonSets.vue'),
      },
      {
        path: 'statefulsets/:namespace?',
        name: 'StatefulSets',
        component: () => import('../views/StatefulSets.vue'),
      },
      {
        path: 'services/:namespace?',
        name: 'Services',
        component: () => import('../views/Services.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
