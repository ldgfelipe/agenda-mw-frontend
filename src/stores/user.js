import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    // El objeto usuario ahora incluirá nombre, rol, id y accesoAdmin
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
    urlHost: window.location.host
  }),

  actions: {
    setSession({ token, usuario }) {
     
      this.token = token
      this.usuario = usuario
      localStorage.setItem('token', token)
      localStorage.setItem('usuario', JSON.stringify(usuario))
    },
    logout() {
      this.token = null
      this.usuario = null
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
    }
  },

  getters: {
    // 🔑 Usamos el signo '?' para que si usuario es null, no intente leer .rol
  role: (s) => s.usuario?.rol || null,
  
  isAuth: (s) => !!s.token,

  puedeAdministrar: (s) => {
    // Si no hay usuario, devolvemos false de inmediato
    if (!s.usuario) return false;
    return s.usuario.rol === 'admin' || s.usuario.accesoAdmin === true;
  },

  userId: (s) => s.usuario?._id || s.usuario?.id || null,
  }
})