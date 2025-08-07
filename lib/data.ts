export const specialties = [
  { id: "cardiologia", name: "Cardiología", icon: "HeartPulse" },
  { id: "dermatologia", name: "Dermatología", icon: "Skin" },
  { id: "pediatria", name: "Pediatría", icon: "Baby" },
  { id: "neurologia", name: "Neurología", icon: "Brain" },
  { id: "ortopedia", name: "Ortopedia", icon: "Bone" },
  { id: "ginecologia", name: "Ginecología", icon: "Stethoscope" }, // Icono genérico
  { id: "oftalmologia", name: "Oftalmología", icon: "Eye" },
  { id: "otorrinolaringologia", name: "Otorrinolaringología", icon: "Ear" },
  { id: "oncologia", name: "Oncología", icon: "Radiation" },
  { id: "endocrinologia", name: "Endocrinología", icon: "Syringe" },
  { id: "gastroenterologia", name: "Gastroenterología", icon: "Stomach" },
  { id: "nefrologia", name: "Nefrología", icon: "Kidney" },
]

export const doctors = {
  cardiologia: [
    { id: "dr-juan-perez", name: "Dr. Juan Pérez", specialtyId: "cardiologia", photo: "/placeholder.svg?height=128&width=128" },
    { id: "dra-ana-gomez", name: "Dra. Ana Gómez", specialtyId: "cardiologia", photo: "/placeholder.svg?height=128&width=128" },
    { id: "dr-luis-martinez", name: "Dr. Luis Martínez", specialtyId: "cardiologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  dermatologia: [
    { id: "dr-carlos-rodriguez", name: "Dr. Carlos Rodríguez", specialtyId: "dermatologia", photo: "/placeholder.svg?height=128&width=128" },
    { id: "dra-sofia-fernandez", name: "Dra. Sofía Fernández", specialtyId: "dermatologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  pediatria: [
    { id: "dra-laura-lopez", name: "Dra. Laura López", specialtyId: "pediatria", photo: "/placeholder.svg?height=128&width=128" },
    { id: "dr-miguel-sanchez", name: "Dr. Miguel Sánchez", specialtyId: "pediatria", photo: "/placeholder.svg?height=128&width=128" },
  ],
  neurologia: [{ id: "dr-javier-garcia", name: "Dr. Javier García", specialtyId: "neurologia", photo: "/placeholder.svg?height=128&width=128" }],
  ortopedia: [{ id: "dra-elena-ruiz", name: "Dra. Elena Ruiz", specialtyId: "ortopedia", photo: "/placeholder.svg?height=128&width=128" }],
  ginecologia: [{ id: "dra-isabel-diaz", name: "Dra. Isabel Díaz", specialtyId: "ginecologia", photo: "/placeholder.svg?height=128&width=128" }],
  oftalmologia: [
    { id: "dr-pablo-hernandez", name: "Dr. Pablo Hernández", specialtyId: "oftalmologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  otorrinolaringologia: [
    { id: "dra-carmen-jimenez", name: "Dra. Carmen Jiménez", specialtyId: "otorrinolaringologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  oncologia: [{ id: "dr-ricardo-moreno", name: "Dr. Ricardo Moreno", specialtyId: "oncologia", photo: "/placeholder.svg?height=128&width=128" }],
  endocrinologia: [
    { id: "dra-patricia-alvarez", name: "Dra. Patricia Álvarez", specialtyId: "endocrinologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  gastroenterologia: [
    { id: "dr-fernando-romero", name: "Dr. Fernando Romero", specialtyId: "gastroenterologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
  nefrologia: [
    { id: "dra-victoria-torres", name: "Dra. Victoria Torres", specialtyId: "nefrologia", photo: "/placeholder.svg?height=128&width=128" },
  ],
}

export const schedules = {
  "dr-juan-perez": {
    monday: { time: "09:00 - 13:00", room: "Consultorio 301", building: "Hospital Principal", floor: "3" },
    wednesday: { time: "14:00 - 18:00", room: "Consultorio 301", building: "Hospital Principal", floor: "3" },
    friday: { time: "09:00 - 13:00", room: "Consultorio 301", building: "Hospital Principal", floor: "3" },
  },
  "dra-ana-gomez": {
    tuesday: { time: "10:00 - 14:00", room: "Consultorio 405", building: "Hospital Principal", floor: "4" },
    thursday: { time: "15:00 - 19:00", room: "Consultorio 405", building: "Hospital Principal", floor: "4" },
  },
  "dr-luis-martinez": {
    monday: { time: "15:00 - 19:00", room: "Consultorio 203", building: "Bless", floor: "2" },
    wednesday: { time: "09:00 - 13:00", room: "Consultorio 203", building: "Bless", floor: "2" },
  },
  "dr-carlos-rodriguez": {
    tuesday: { time: "08:00 - 12:00", room: "Consultorio 202", building: "Hospital Principal", floor: "2" },
    thursday: { time: "13:00 - 17:00", room: "Consultorio 202", building: "Hospital Principal", floor: "2" },
  },
  "dra-sofia-fernandez": {
    monday: { time: "10:00 - 14:00", room: "Consultorio 101", building: "Bless", floor: "1" },
    friday: { time: "10:00 - 14:00", room: "Consultorio 101", building: "Bless", floor: "1" },
  },
  "dra-laura-lopez": {
    wednesday: { time: "11:00 - 15:00", room: "Consultorio 101", building: "Bless", floor: "1" },
    friday: { time: "14:00 - 18:00", room: "Consultorio 101", building: "Bless", floor: "1" },
  },
  "dr-miguel-sanchez": {
    tuesday: { time: "09:00 - 13:00", room: "Consultorio 305", building: "Hospital Principal", floor: "3" },
    thursday: { time: "09:00 - 13:00", room: "Consultorio 305", building: "Hospital Principal", floor: "3" },
  },
  "dr-javier-garcia": {
    monday: { time: "10:00 - 14:00", room: "Consultorio 501", building: "Bless", floor: "5" },
    wednesday: { time: "10:00 - 14:00", room: "Consultorio 501", building: "Bless", floor: "5" },
  },
  "dra-elena-ruiz": {
    tuesday: { time: "11:00 - 15:00", room: "Consultorio 602", building: "Bless", floor: "6" },
    thursday: { time: "11:00 - 15:00", room: "Consultorio 602", building: "Bless", floor: "6" },
  },
  "dra-isabel-diaz": {
    monday: { time: "08:00 - 12:00", room: "Consultorio 701", building: "Hospital Principal", floor: "7" },
    friday: { time: "08:00 - 12:00", room: "Consultorio 701", building: "Hospital Principal", floor: "7" },
  },
  "dr-pablo-hernandez": {
    wednesday: { time: "13:00 - 17:00", room: "Consultorio 803", building: "Bless", floor: "8" },
  },
  "dra-carmen-jimenez": {
    thursday: { time: "09:00 - 13:00", room: "Consultorio 901", building: "Bless", floor: "9" },
  },
  "dr-ricardo-moreno": {
    monday: { time: "14:00 - 18:00", room: "Consultorio 1001", building: "Hospital Principal", floor: "10" },
  },
  "dra-patricia-alvarez": {
    tuesday: { time: "10:00 - 14:00", room: "Consultorio 1102", building: "Bless", floor: "11" },
  },
  "dr-fernando-romero": {
    wednesday: { time: "09:00 - 13:00", room: "Consultorio 1201", building: "Hospital Principal", floor: "12" },
  },
  "dra-victoria-torres": {
    thursday: { time: "15:00 - 19:00", room: "Consultorio 1301", building: "Hospital Principal", floor: "13" },
  },
}

// Aplanar la lista de doctores para la búsqueda por nombre
export const allDoctorsFlat = Object.values(doctors).flat()

export const metadata = {
  title: "Especialidades y Doctores",
  description: "Consulta nuestras especialidades médicas y encuentra el doctor ideal para ti.",
}
