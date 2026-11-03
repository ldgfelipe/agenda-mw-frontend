<template>
  <v-container class="perfil-page">
    <v-row justify="center">
      <v-col cols="12" md="9" lg="7">
        <v-card class="perfil-card">
          <v-card-title class="text-h5 d-flex align-center">
            <v-icon start>mdi-account-circle</v-icon>
            Perfil
          </v-card-title>

          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-alert v-if="successMsg" type="success" class="mb-4">{{ successMsg }}</v-alert>
            <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

            <template v-if="perfil">
              <v-row v-if="!editando">
                <v-col cols="12" md="6">
                  <v-text-field :model-value="perfil.nombre" label="Nombre" readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field :model-value="perfil.email" label="Correo" readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field :model-value="perfil.rol" label="Rol" readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field :model-value="perfil.telefono || 'No registrado'" label="Telefono" readonly />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    :model-value="perfil.observaciones || 'Sin observaciones registradas'"
                    label="Observaciones"
                    rows="4"
                    readonly
                  />
                </v-col>
              </v-row>

              <v-row v-else>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editNombre" label="Nombre" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editEmail" label="Correo" type="email" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field :model-value="perfil.rol" label="Rol" readonly />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model="editTelefono" label="Telefono" type="tel" />
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="editObservaciones" label="Observaciones" rows="4" />
                </v-col>
              </v-row>

              <div class="mt-3">
                <v-chip color="primary" class="me-2">{{ perfil.rol }}</v-chip>
                <v-chip v-if="perfil.accesoAdmin" color="success">Acceso administrador medico</v-chip>
              </div>
            </template>
          </v-card-text>

          <v-card-actions>
            <v-spacer />
            <v-btn v-if="!editando" color="primary" variant="tonal" @click="iniciarEdicion">
              Editar
            </v-btn>
            <template v-if="editando">
              <v-btn color="error" variant="tonal" @click="cancelarEdicion">
                Cancelar
              </v-btn>
              <v-btn color="success" variant="tonal" @click="guardarPerfil" :loading="guardando">
                Guardar
              </v-btn>
            </template>
            <v-btn color="primary" variant="tonal" @click="cargarPerfil" :loading="loading">
              Recargar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/plugins/axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const error = ref('')
const successMsg = ref('')
const perfil = ref(null)

const editando = ref(false)
const guardando = ref(false)
const editNombre = ref('')
const editEmail = ref('')
const editTelefono = ref('')
const editObservaciones = ref('')

const cargarPerfil = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get('/perfil')
    perfil.value = data

    if (userStore.token) {
      userStore.setSession({
        token: userStore.token,
        usuario: {
          ...userStore.usuario,
          ...data
        }
      })
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'No se pudo cargar el perfil.'
  } finally {
    loading.value = false
  }
}

const iniciarEdicion = () => {
  editNombre.value = perfil.value.nombre
  editEmail.value = perfil.value.email
  editTelefono.value = perfil.value.telefono || ''
  editObservaciones.value = perfil.value.observaciones || ''
  editando.value = true
  error.value = ''
  successMsg.value = ''
}

const cancelarEdicion = () => {
  editando.value = false
  error.value = ''
  successMsg.value = ''
}

const guardarPerfil = async () => {
  guardando.value = true
  error.value = ''
  successMsg.value = ''

  try {
    const { data } = await api.put('/perfil', {
      nombre: editNombre.value,
      email: editEmail.value,
      telefono: editTelefono.value,
      observaciones: editObservaciones.value
    })

    perfil.value = data
    editando.value = false
    successMsg.value = 'Perfil actualizado correctamente'

    if (userStore.token) {
      userStore.setSession({
        token: userStore.token,
        usuario: {
          ...userStore.usuario,
          ...data
        }
      })
    }
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar el perfil.'
  } finally {
    guardando.value = false
  }
}

onMounted(cargarPerfil)
</script>

<style scoped>
.perfil-page {
  padding-top: 24px;
}

.perfil-card {
  border-radius: 16px;
}
</style>
