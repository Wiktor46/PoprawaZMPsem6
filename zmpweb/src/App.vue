<script setup>
import { ref, onMounted } from 'vue'
import * as signalR from '@microsoft/signalr'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import BookCatalog from './components/BookCatalog.vue'

const currentView = ref('catalog') // 'catalog' | 'login' | 'register'
const currentUser = ref(null)
const token = ref('')
const notifications = ref([])

const API_BASE = 'http://localhost:5228'

const handleLoginSuccess = (userData) => {
  currentUser.value = userData
  token.value = userData.token
  currentView.value = 'catalog'
  setupSignalR()
}

const logout = () => {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('user')
  currentUser.value = null
  token.value = ''
  currentView.value = 'catalog'
}

const setupSignalR = () => {
  if (!token.value) return

  const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/notifications?access_token=${token.value}`)
      .configureLogging(signalR.LogLevel.Information)
      .build()

  // Odbieranie powiadomienia o zwolnieniu rezerwacji (zgodne z backendowym SendBookAvailableNotificationAsync)
  connection.on('BookAvailable', (data) => {
    notifications.value.unshift(data.message)
  })

  connection.start().catch(err => console.error('Błąd połączenia SignalR:', err))
}

onMounted(() => {
  const savedToken = localStorage.getItem('jwt_token')
  const savedUser = localStorage.getItem('user')
  if (savedToken && savedUser) {
    token.value = savedToken
    currentUser.value = JSON.parse(savedUser)
    setupSignalR()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800">
    <!-- Pasek nawigacyjny -->
    <header class="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
      <div class="flex items-center space-x-2 cursor-pointer" @click="currentView = 'catalog'">
        <span class="font-bold text-xl text-indigo-600">LibraryApp</span>
      </div>

      <nav class="flex items-center space-x-4">
        <button @click="currentView = 'catalog'" class="text-sm font-medium hover:text-indigo-600">
          Katalog
        </button>

        <template v-if="!currentUser">
          <button @click="currentView = 'login'" class="text-sm font-medium text-slate-600 hover:text-indigo-600">
            Zaloguj
          </button>
          <button @click="currentView = 'register'" class="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Rejestracja
          </button>
        </template>

        <template v-else>
          <span class="text-sm text-slate-600">Witaj, <b>{{ currentUser.fullName || currentUser.email }}</b></span>
          <button @click="logout" class="text-sm font-medium text-red-600 hover:underline">
            Wyloguj
          </button>
        </template>
      </nav>
    </header>

    <!-- Pasek powiadomień w czasie rzeczywistym -->
    <div v-if="notifications.length > 0" class="max-w-5xl mx-auto mt-4 px-6">
      <div v-for="(note, index) in notifications" :key="index" class="p-4 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl mb-2 flex justify-between items-center">
        <span>🔔 {{ note }}</span>
        <button @click="notifications.splice(index, 1)" class="text-xs font-bold text-emerald-900">Zamknij</button>
      </div>
    </div>

    <!-- Główna zawartość -->
    <main>
      <BookCatalog v-if="currentView === 'catalog'" :currentUser="currentUser" :token="token" />
      <Login v-else-if="currentView === 'login'" @login-success="handleLoginSuccess" @switch-to-register="currentView = 'register'" />
      <Register v-else-if="currentView === 'register'" @switch-to-login="currentView = 'login'" />
    </main>
  </div>
</template>