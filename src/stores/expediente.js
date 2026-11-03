import { defineStore } from 'pinia'

export const useExpedienteStore = defineStore('expediente', {
  state: () => ({
    paciente: null,
    consultaActivaId: null,
    consultaActiva: null,
  }),
  actions: {
    setExpediente(pacienteData) {
      this.paciente = pacienteData
    },
    setConsultaActiva(consulta) {
      if (typeof consulta === 'string' || consulta === null) {
        this.consultaActivaId = consulta
        if (consulta === null) this.consultaActiva = null
        return
      }

      this.consultaActiva = consulta
      this.consultaActivaId = consulta?._id || null
    },
    clearExpediente() {
      this.paciente = null
      this.consultaActivaId = null
      this.consultaActiva = null
    }
  },
  getters: {
    expedienteId: (state) => state.paciente?._id || null,
    nombrePaciente: (state) => state.paciente ? `${state.paciente.nombre} ${state.paciente.primerApellido}` : ''
  }
})
