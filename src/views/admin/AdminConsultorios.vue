<template>
  <v-container>
    <h2>Registro de consultorios</h2>
    <v-form @submit.prevent="crear">
      <v-text-field v-model="nombre" label="Nombre" required />
      <v-text-field v-model="codigo" label="Código (único)" required />
      <v-text-field v-model="ubicacion" label="Ubicación" />
      <v-select v-model="estado" :items="['activo','inactivo']" label="Estado" />
      <v-btn type="submit" color="success">Guardar</v-btn>
    </v-form>

    <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
    <v-alert v-if="ok" type="success" class="mt-3">Operación exitosa</v-alert>

    <v-divider class="my-6" />
    <h3>Consultorios</h3>
    <v-data-table :items="items" :headers="headers" density="compact">
      <template #item.actions="{ item }">
        <v-btn icon size="small" color="primary" class="mr-2" @click="editarItem(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon size="small" color="error" @click="eliminarItem(item)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
      </v-data-table>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Editar Consultorio</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-text-field v-model="editedItem.nombre" label="Nombre" />
            <v-text-field v-model="editedItem.codigo" label="Código" disabled /> 
            <v-text-field v-model="editedItem.ubicacion" label="Ubicación" />
            <v-select v-model="editedItem.estado" :items="['activo','inactivo']" label="Estado" />
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="dialog = false">Cancelar</v-btn>
          <v-btn color="blue darken-1" text @click="guardarEdicion">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../plugins/axios'

// Variables de Creación Originales
const nombre = ref('')
const codigo = ref('')
const ubicacion = ref('')
const estado = ref('activo')
const error = ref('')
const ok = ref(false)
const items = ref([])

// INICIO: NUEVAS VARIABLES para Edición
const dialog = ref(false) // Controla si el diálogo de edición está abierto
const editedItem = ref({}) // Almacena los datos del consultorio que se está editando
// FIN: NUEVAS VARIABLES para Edición

// Headers Modificados para incluir la columna de Acciones
const headers = [
  { title: 'Nombre', value: 'nombre' },
  { title: 'Código', value: 'codigo' },
  { title: 'Ubicación', value: 'ubicacion' },
  { title: 'Estado', value: 'estado' },
  { title: 'Creado', value: 'createdAt' },
  { title: 'Acciones', value: 'actions', sortable: false } // 🔑 Columna de Acciones
]

// Función Cargar (Original)
const cargar = async () => {
  try {
    const { data } = await api.get('/consultorios')
    items.value = data
  } catch (err) {
    error.value = 'Error al cargar consultorios.'
  }
}

// Función Crear (Original, se ajusta el mensaje de éxito)
const crear = async () => {
  error.value = ''
  ok.value = false
  try {
    await api.post('/consultorios', {
      nombre: nombre.value,
      codigo: codigo.value,
      ubicacion: ubicacion.value,
      estado: estado.value
    })
    ok.value = true // Indica éxito
    // Limpiar formulario
    nombre.value = ''
    codigo.value = ''
    ubicacion.value = ''
    estado.value = 'activo'
    await cargar() // Recargar lista
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al crear consultorio'
  }
}

// INICIO: NUEVAS FUNCIONES DE EDICIÓN Y ELIMINACIÓN

/**
 * Prepara el formulario de diálogo para la edición.
 * @param {Object} item - El consultorio a editar.
 */
const editarItem = (item) => {
  // Se clona el objeto para evitar modificar la tabla directamente antes de guardar
  editedItem.value = { ...item }
  ok.value = false
  dialog.value = true
}

/**
 * Envía la petición PATCH para actualizar el consultorio.
 */
const guardarEdicion = async () => {
  error.value = ''
  ok.value = false
  try {
    // Envía los datos actualizados al backend
    await api.put(`/consultorios/${editedItem.value._id}`, editedItem.value)
    
    dialog.value = false // Cierra el diálogo
    ok.value = true
    await cargar() // Recarga la lista para reflejar los cambios
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al actualizar consultorio'
  }
}

/**
 * Elimina un consultorio tras confirmación.
 * @param {Object} item - El consultorio a eliminar.
 */
const eliminarItem = async (item) => {
  if (confirm(`¿Estás seguro de que quieres eliminar el consultorio ${item.nombre} (Código: ${item.codigo})?`)) {
    error.value = ''
    ok.value = false
    try {
      // Envía la petición DELETE con el ID
      await api.delete(`/consultorios/${item._id}`)
      ok.value = true
      await cargar() // Recarga la lista
    } catch (err) {
      error.value = err.response?.data?.error || 'Error al eliminar consultorio'
    }
  }
}
// FIN: NUEVAS FUNCIONES DE EDICIÓN Y ELIMINACIÓN

onMounted(cargar)
</script>
