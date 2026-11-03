import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'
import Dashboard from '../views/DashboardView.vue'
import AdminConsultorios from '../views/admin/AdminConsultorios.vue'
import AdminUsuarios from '../views/admin/AdminUsuarios.vue'
import AdminSolicitudes from '../views/admin/AdminSolicitudes.vue'
import HomeMD from '../views/HomeMD.vue'
import LoginArea from '../views/LoginArea.vue'
import adminMediWork from '../views/adminMediWork/AdminDashboard.vue'
import ProfileView from '../views/ProfileView.vue'

const routes = [
  { path: '/', name: 'InicioIndex', component: HomeMD },
  { path: '/LoginArea', name: 'LoginArea', component: LoginArea },
  { path: '/Dashboard', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/perfil', name: 'perfil', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/admin/consultorios', name: 'admin-consultorios', component: AdminConsultorios, meta: { requiresAuth: true, requiresRole: 'admin' } },
  { path: '/admin/usuarios', name: 'admin-usuarios', component: AdminUsuarios, meta: { requiresAuth: true, requiresRole: 'admin' } },
  { path: '/admin/solicitudes', name: 'admin-solicitudes', component: AdminSolicitudes, meta: { requiresAuth: true, requiresRole: 'admin' } },
  { path: '/adminMedicWork/', name: 'admin-mediwork', component: adminMediWork, meta: { requiresAuth: true, allowAdminAccess: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const store = useUserStore()

  if (to.meta.requiresAuth && !store.isAuth) {
    return { name: 'LoginArea' }
  }

  if (to.meta.requiresRole && !(store.role === to.meta.requiresRole || (to.meta.requiresRole === 'admin' && store.role === 'administrador') || (to.meta.requiresRole === 'administrador' && store.role === 'admin'))) {
    return { name: 'dashboard' }
  }

  if (to.meta.allowAdminAccess && !store.puedeAdministrar) {
    return { name: 'dashboard' }
  }
})

export default router
