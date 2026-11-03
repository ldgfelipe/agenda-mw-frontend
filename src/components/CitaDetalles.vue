<template>
  <v-card :loading="cargando">
    <v-card-title class="text-h6 error white--text">
      Detalles y Gestión de Reserva
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('cerrar')" variant="text">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="formRef" @submit.prevent="modificarCita">
        
        <v-list dense class="mb-4 pa-0">
          <v-list-item class="pa-0">
            <v-list-item-title class="font-weight-bold">ID Cita:</v-list-item-title>
            <v-list-item-subtitle>{{ form._id }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="pa-0">
            <v-list-item-title class="font-weight-bold">Día y Hora:</v-list-item-title>
            <v-list-item-subtitle>{{ fechaHoraFormateada }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item class="pa-0">
            <v-list-item-title class="font-weight-bold">Consultorio:</v-list-item-title>
            <v-list-item-subtitle>{{ form.nombreConsultorio }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-3"></v-divider>
        
        <v-text-field
          v-model="form.pacienteNombre"
          label="Nombre del Paciente"
          required
          :rules="[v => !!v || 'El nombre es requerido']"
        ></v-text-field>

          <v-text-field
          v-model="form.pacienteTelefono"
          label="Número de Teléfono"
        ></v-text-field>

        <v-card class="elevation-10" v-if="form.estado === 'pendiente'">
          <v-card-title color="success">
            Comparte y Confirma tu cita
          </v-card-title>
          <v-card-text>
        <v-btn color="success" @click="compartirPorWhatsApp(form)">Compartir por Whatsapp</v-btn> 
        <br /><br />
       <v-list>
         <v-list-item prepend-icon="mdi-phone">
            <v-list-item-title>
              {{ citaData.pacienteTelefono }}
              <v-tooltip text="Escanear para enviar por WhatsApp" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-qrcode-scan"
                    variant="text"
                    color="success"
                    size="small"
                    class="ml-2"
                    v-bind="props"
                    @click="abrirModalQR"
                    :disabled="!citaData.pacienteTelefono"
                  >
                  </v-btn>
                </template>
              </v-tooltip>
            </v-list-item-title>
         </v-list-item>

         </v-list>


          </v-card-text>
         </v-card>

         <v-dialog v-model="dialogQR" max-width="350px">
      <v-card class="text-center pa-4">
        <v-card-title class="text-h6 mb-4">
          Escanea con tu celular
        </v-card-title>
        <v-card-text class="d-flex justify-center">
           <qrcode-vue
            v-if="urlParaQR"
            :value="urlParaQR"
            :size="250"
            level="H"
            render-as="svg"
          />
        </v-card-text>
        <v-card-subtitle class="mt-2 text-wrap font-weight-bold">
            Se abrirá WhatsApp con los datos de la cita.
        </v-card-subtitle>
        <v-card-actions class="justify-center mt-3">
          <v-btn color="primary" variant="tonal" @click="dialogQR = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

            <br /><br />      
        <v-text-field
          v-model="form.pacienteCorreo"
          label="Nombre del Correo"
        ></v-text-field>

        <v-textarea
          v-model="form.pacienteNotas"
          label="Notas del Paciente"
          rows="3"
        ></v-textarea>

        <v-text-field
          v-model.number="form.costoConsulta"
          label="Costo de la Consulta"
          prefix="$"
          type="number"
          required
          :rules="[v => v >= 0 || 'El costo debe ser cero o positivo']"
        ></v-text-field>

        <v-select v-if="rol==='admin'" v-model="form.estado" :items="['pendiente','confirmada','completada']" label="Cambiar Estado de Cita"></v-select>
        <v-alert :type="form.estado === 'cancelada' ? 'error' : 'success'" dense>
          Estado: **{{ form.estado && form.estado.toUpperCase() }}**
        </v-alert>

        
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-btn 
        color="red" 
        text 
        @click="abrirCancelarDialogo" 
        :disabled="form.estado === 'cancelada' || cargando"
      >
        Cancelar Cita
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="grey" text @click="$emit('cerrar')" :disabled="cargando">Cerrar</v-btn>
      <v-btn color="primary" @click="modificarCita" :loading="cargando" :disabled="form.estado === 'cancelada'">
        Guardar Cambios
      </v-btn>
    </v-card-actions>
    
    <!-- Diálogo para ADMIN: cancelación directa -->
    <v-dialog v-model="dialogConfirmarCancelacion" max-width="350">
        <v-card>
            <v-card-title class="text-h6 red white--text">Confirmar</v-card-title>
            <v-card-text class="pt-4">¿Estás seguro de que deseas CANCELAR esta cita?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="dialogConfirmarCancelacion = false">No</v-btn>
                <v-btn color="red" text @click="cancelarCitaDirecta" :loading="cargando">Sí, Cancelar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Diálogo para MÉDICO: solicitar cancelación al administrador -->
    <v-dialog v-model="dialogSolicitudCancelacion" max-width="500">
        <v-card>
            <v-card-title class="text-h6 red white--text">Solicitar cancelación</v-card-title>
            <v-card-text class="pt-4">
                <v-textarea
                    v-model="motivoCancelacion"
                    label="Motivo de la cancelación"
                    rows="3"
                    required
                    :rules="[v => !!v || 'El motivo es obligatorio']"
                ></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" text @click="dialogSolicitudCancelacion = false">Cancelar</v-btn>
                <v-btn color="red" text @click="enviarSolicitudCancelacion" :loading="cargandoSolicitud">Enviar solicitud</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{ snackbar.message }}</v-snackbar>
  </v-card>
</template>


<script setup>
import { ref, computed, watch } from 'vue';
import api from '@/plugins/axios'; 
// 🔑 1. Importar el componente QRcodeVue
import QrcodeVue from 'qrcode.vue';
/*import { useUserStore } from '../stores/user.js'; // 🔑 Importación del store
const userStore = useUserStore();*/
//const rol = userStore.usuario.rol
// --- Lógica del Código QR ---
import { useUserStore } from '../stores/user.js';
const dialogQR = ref(false); // Controla la visibilidad del modal QR
const urlParaQR = ref(''); // Almacena la URL que el QR va a codificar

const userStore = useUserStore();
const rol = computed(() => userStore.usuario?.rol || null);
const props = defineProps({
    citaData: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['cerrar', 'citaModificada', 'citaCancelada']);

const form = ref({});
const cargando = ref(false);
const cargandoSolicitud = ref(false);
const dialogConfirmarCancelacion = ref(false);
const dialogSolicitudCancelacion = ref(false);
const motivoCancelacion = ref('');
const snackbar = ref({ show: false, message: '', color: 'success' });
const formRef = ref(null);

// 🔑 Sincronización de datos: Es crucial para cargar los detalles
watch(() => props.citaData, (newValue) => {
    if (newValue && newValue._id) {
        // Hacemos una copia profunda. Transformamos la fecha de string a Date si es necesario.
        form.value = { 
            ...newValue,
            fechaHoraInicio: new Date(newValue.fechaHoraInicio) // Asegurar que es un objeto Date
        };
    }
}, { deep: true, immediate: true });

// Propiedad computada para el formato de fecha
const fechaHoraFormateada = computed(() => {
    const fecha = form.value.fechaHoraInicio;
    
    if (!fecha || !(fecha instanceof Date)) return 'Fecha no disponible';
    
    return fecha.toLocaleString('es', {
        timeZone: 'UTC',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// ----------------------------------------------------
// LÓGICA DE GESTIÓN DE CITA (MODIFICAR Y CANCELAR)
// ----------------------------------------------------

const modificarCita = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid || form.value.estado === 'cancelada') return;

    cargando.value = true;
    
    const id = form.value._id;
    const payload = {
        paciente: {nombre: form.value.pacienteNombre,telefono: form.value.pacienteTelefono,correo: form.value.pacienteCorreo,notas: form.value.pacienteNotas},
        costo: form.value.costoConsulta,
        estado:form.value.estado
    };

    try {
        // 1. Enviar el cambio al backend (Necesitas crear el endpoint PUT /citas/:id)
        await api.put(`/citas/${id}`, payload);

        snackbar.value = { show: true, message: 'Cita actualizada con éxito!', color: 'success' };
        
        // 2. Emitir evento para que el padre recargue los datos
        setTimeout(() => {
            emit('citaModificada'); 
        }, 1000);

    } catch (error) {
        console.error("Error al modificar cita:", error);
        snackbar.value = { show: true, message: 'Error al modificar. Inténtalo de nuevo.', color: 'error' };
    } finally {
        cargando.value = false;
    }
};

// ----------------------------------------------------
// LÓGICA DE GESTIÓN DE CANCELACIÓN (admin directo / médico solicita)
// ----------------------------------------------------

// Abrir el diálogo correcto según el rol del usuario
const abrirCancelarDialogo = () => {
  if (rol.value === 'admin') {
    dialogConfirmarCancelacion.value = true;
  } else {
    // Si está pendiente o ya se solicitó, controlamos desde aquí
    if (form.value.estado === 'pendiente' || form.value.estado === 'confirmada') {
      motivoCancelacion.value = '';
      dialogSolicitudCancelacion.value = true;
    } else if (form.value.estado === 'cancelada') {
      // No se puede solicitar una cancelación de cita cancelada
      console.warn("La cita ya está cancelada.");
    }
  }
};

// Enviar solicitud de cancelación (solo médicos)
const enviarSolicitudCancelacion = async () => {
  if (!motivoCancelacion.value || !motivoCancelacion.value.trim()) {
    return;
  }
  dialogSolicitudCancelacion.value = false;
  cargandoSolicitud.value = true;

  try {
    const id = form.value._id;
    await api.post(`/citas/${id}/solicitar-cancelacion`, {
      motivo: motivoCancelacion.value.trim()
    });

    snackbar.value = {
      show: true,
      message: 'Solicitud enviada. Esperando autorización del administrador.',
      color: 'info'
    };

    // Mantener el estado local reflejando "solicitud enviada"
    setTimeout(() => {
      emit('citaCancelada');
    }, 1000);

  } catch (error) {
    snackbar.value = {
      show: true,
      message: error.response?.data?.error || 'Error al solicitar cancelación.',
      color: 'error'
    };
  } finally {
    cargandoSolicitud.value = false;
  }
};

// Cancelar directamente (solo admin)
const cancelarCitaDirecta = async () => {
  if (form.value.estado === 'cancelada') return;

  dialogConfirmarCancelacion.value = false;
  cargando.value = true;
  const id = form.value._id;

  try {
    // Cambiar estado de la cita a 'cancelada' mediante PUT (permitido para admin)
    await api.put(`/citas/${id}`, { estado: 'cancelada' });

    form.value.estado = 'cancelada';

    snackbar.value = { show: true, message: 'Cita cancelada con éxito.', color: 'red' };

    setTimeout(() => {
      emit('citaCancelada');
    }, 1000);

  } catch (error) {
    console.error("Error al cancelar cita:", error);
    snackbar.value = { show: true, message: 'Error al cancelar. Inténtalo de nuevo.', color: 'error' };
  } finally {
    cargando.value = false;
  }
};


const compartirPorWhatsApp = (cita) => {
  // 1. Limpiar el teléfono (debe tener código de país, ej: 521 para México)
  // Eliminamos espacios, guiones o paréntesis que pueda tener el input
  const telefonoLimpio = cita.pacienteTelefono.replace(/\D/g, '');

  // 2. Formatear la fecha y hora para que sea legible
  const fecha = new Date(cita.fechaHoraInicio).toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  const hora = new Date(cita.fechaHoraInicio).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 3. Crear el mensaje (puedes usar negritas con asteriscos *)
  const mensaje = `Hola *${cita.pacienteNombre}*, le confirmamos su cita:
  
*Lugar:* Blvd. Héroes del 5 de Mayo 2307, El Carmen, Puebla, Pue.
*Mapa:* https://maps.app.goo.gl/mjvGef5Dkui7SXRd7
*Fecha:* ${fecha}
*Hora:* ${hora}
*Médico:* ${cita.nombreMedico}

Por favor, llegue 10 minutos antes. ¡Le esperamos!`;

  // 4. Codificar el mensaje para URL
  const mensajeEncoded = encodeURIComponent(mensaje);

  // 5. Crear el link final
  const url = `https://wa.me/${telefonoLimpio}?text=${mensajeEncoded}`;

  // 6. Abrir en una nueva pestaña
  window.open(url, '_blank');
};

// Función auxiliar para generar la URL de WhatsApp (sin abrirla)
const generarUrlWhatsApp = (cita) => {
  if (!cita || !cita.pacienteTelefono) return '';

  // 🚨 IMPORTANTE: Asegúrate de que el teléfono tenga el código de país.
  // Si tus usuarios solo meten 10 dígitos (ej. México), antepón el código aquí.
  // Ejemplo para México: const telefonoLimpio = '52' + cita.pacienteTelefono.replace(/\D/g, '');
  const telefonoLimpio = cita.pacienteTelefono.replace(/\D/g, '');

  const fecha = new Date(cita.fechaHoraInicio).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  const hora = new Date(cita.fechaHoraInicio).toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit'
  });

  const mensaje = `Hola *${cita.pacienteNombre}*, confirmamos su cita:
📍 *Lugar:* ${cita.nombreConsultorio}
📅 *Fecha:* ${fecha}
⏰ *Hora:* ${hora}
👨‍⚕️ *Médico:* ${cita.nombreMedico}
¡Le esperamos!`;

  const mensajeEncoded = encodeURIComponent(mensaje);
  // Retorna la URL completa
  return `https://wa.me/${telefonoLimpio}?text=${mensajeEncoded}`;
};

// Función que se activa al hacer clic en el botón "Mostrar QR"
const abrirModalQR = () => {
  // 1. Generamos la URL basada en la cita actual
  const url = generarUrlWhatsApp(props.citaData);
  
  if (url) {
    // 2. Asignamos la URL y abrimos el modal
    urlParaQR.value = url;
    dialogQR.value = true;
  } else {
     // Manejar el caso de que falte el teléfono (ej. mostrar un snackbar de error)
     console.error("Falta el teléfono del paciente para generar el QR");
  }
};
// ---------------------------
</script>
