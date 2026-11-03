<template>
  <v-container>
    <v-card>
      <v-card-title class="d-flex align-center pe-2">
        <v-icon icon="mdi-account-group" class="me-2"></v-icon>
        Gestión de Usuarios
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="abrirDialogoCrear">
          Nuevo Usuario
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Buscar usuario..."
        single-line
        hide-details
        class="pa-4"
      ></v-text-field>

      <v-data-table
        :headers="headers"
        :items="usuarios"
        :search="search"
        :loading="loading"
        no-data-text="No hay usuarios registrados"
      >
        <template v-slot:item.rol="{ item }">
          <v-chip
            :color="item.rol === 'admin' ? 'red' : 'blue'"
            size="small"
            class="text-uppercase"
          >
            {{ item.rol }}
          </v-chip>
        </template>

        <template v-slot:item.accesoAdmin="{ item }">
          <v-icon :color="item.rol === 'admin' || item.accesoAdmin ? 'green' : 'grey-lighten-1'">
            {{ item.rol === 'admin' || item.accesoAdmin ? 'mdi-shield-check' : 'mdi-shield-off' }}
          </v-icon>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-icon size="small" class="me-2" color="blue" @click="editarUsuario(item)">
            mdi-pencil
          </v-icon>
          <v-icon size="small" color="red" @click="confirmarEliminar(item)">
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ formTitle }}</span>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="editedItem.nombre" label="Nombre completo"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.email" label="Correo Electrónico"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.telefono" label="Teléfono"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="editedItem.rol"
                  :items="['admin', 'medico']"
                  label="Rol de usuario"
                ></v-select>
              </v-col>

              <v-col cols="12" v-if="editedItem.rol !== 'admin'">
                <v-switch
                  v-model="editedItem.accesoAdmin"
                  label="Permitir acceso a Administrador Médico"
                  color="success"
                  hide-details
                  inset
                ></v-switch>
                <div class="text-caption text-grey mt-n2">
                  Permite que este usuario use funciones de configuración aunque no sea Administrador Global.
                </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.observaciones"
                  label="Observaciones"
                  rows="3"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.password"
                  label="Contraseña"
                  type="password"
                  hint="Dejar en blanco para no cambiar"
                  persistent-hint
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cerrarDialogo">Cancelar</v-btn>
          <v-btn color="blue-darken-1" variant="text" @click="guardarUsuario">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogDelete" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 text-center">¿Estás seguro de eliminar este usuario?</v-card-title>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogDelete = false">No</v-btn>
          <v-btn color="red-darken-1" variant="text" @click="eliminarUsuarioConfirmado">Sí, eliminar</v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../plugins/axios'

const search = ref('')
const loading = ref(false)
const dialog = ref(false)
const dialogDelete = ref(false)
const usuarios = ref([])

const headers = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Email', key: 'email' },
  { title: 'Teléfono', key: 'telefono' },
  { title: 'Rol', key: 'rol' },
  { title: 'Acceso Admin', key: 'accesoAdmin', align: 'center' }, // 🔑 Columna añadida
  { title: 'Acciones', key: 'actions', sortable: false },
]

const editedIndex = ref(-1)
const editedItem = ref({
  nombre: '',
  email: '',
  telefono: '',
  observaciones: '',
  rol: 'medico',
  accesoAdmin: false, // 🔑 Campo añadido
  password: ''
})
const defaultItem = {
  nombre: '',
  email: '',
  telefono: '',
  observaciones: '',
  rol: 'medico',
  accesoAdmin: false, // 🔑 Campo añadido
  password: ''
}

const formTitle = computed(() => {
  return editedIndex.value === -1 ? 'Nuevo Usuario' : 'Editar Usuario'
})

// --- MÉTODOS ---

const obtenerUsuarios = async () => {
  loading.value = true
  try {
    const res = await api.get('/usuarios') 
    usuarios.value = res.data
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
  } finally {
    loading.value = false
  }
}

const abrirDialogoCrear = () => {
  editedIndex.value = -1
  editedItem.value = { ...defaultItem }
  dialog.value = true
}

const editarUsuario = (item) => {
  editedIndex.value = usuarios.value.indexOf(item)
  // 🔑 Nos aseguramos de copiar el estado de accesoAdmin
  editedItem.value = { ...item, password: '', accesoAdmin: item.accesoAdmin || false } 
  dialog.value = true
}

const guardarUsuario = async () => {
  try {
    // Si es admin, por lógica siempre tiene accesoAdmin true
    if(editedItem.value.rol === 'admin') editedItem.value.accesoAdmin = true;

    if (editedIndex.value > -1) {
      await api.put(`/usuarios/${editedItem.value._id}`, editedItem.value)
    } else {
      await api.post('/register', editedItem.value)
    }
    obtenerUsuarios()
    cerrarDialogo()
  } catch (error) {
    alert(error.response?.data?.error || 'Error al guardar')
  }
}

const confirmarEliminar = (item) => {
  editedItem.value = item
  dialogDelete.value = true
}

const eliminarUsuarioConfirmado = async () => {
  try {
    await api.delete(`/usuarios/${editedItem.value._id}`)
    obtenerUsuarios()
    dialogDelete.value = false
  } catch (error) {
    alert('Error al eliminar')
  }
}

const cerrarDialogo = () => {
  dialog.value = false
  editedItem.value = { ...defaultItem }
  editedIndex.value = -1
}

onMounted(obtenerUsuarios)
</script>