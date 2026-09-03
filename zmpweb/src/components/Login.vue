<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const emit = defineEmits(['login-success', 'switch-to-register'])

const API_BASE = 'https://poprawazmpsem6-api.onrender.com'

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value })
    })

    if (!response.ok) {
      throw new Error('Nieprawidłowy e-mail lub hasło.')
    }

    const data = await response.json()
    localStorage.setItem('jwt_token', data.token)
    localStorage.setItem('user', JSON.stringify(data))

    emit('login-success', data)
  } catch (error) {
    errorMessage.value = error.message || 'Błąd logowania.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div class="px-8 pt-8 pb-6 text-center">
        <h1 class="text-2xl font-bold text-slate-800">Portal Biblioteki</h1>
        <p class="text-sm text-slate-500 mt-1">Zaloguj się, aby zarezerwować książki</p>
      </div>

      <div v-if="errorMessage" class="mx-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="px-8 pb-8 space-y-5">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Adres Email</label>
          <input v-model="email" type="email" required placeholder="reader@library.com" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Hasło</label>
          <input v-model="password" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg" />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-2.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition">
          {{ isLoading ? 'Logowanie...' : 'Zaloguj się' }}
        </button>
      </form>

      <div class="px-8 py-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
        Nie masz konta?
        <button @click="emit('switch-to-register')" class="font-medium text-indigo-600 hover:underline ml-1">Zarejestruj się</button>
      </div>
    </div>
  </div>
</template>