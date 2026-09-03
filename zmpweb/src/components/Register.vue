<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const fullName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const emit = defineEmits(['switch-to-login'])

const API_BASE = 'https://poprawazmpsem6-api.onrender.com'

const handleRegister = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        fullName: fullName.value
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.message || 'Błąd rejestracji.')
    }

    successMessage.value = 'Konto zostało utworzone! Możesz się zalogować.'
    setTimeout(() => emit('switch-to-login'), 1500)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-100 p-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
      <h2 class="text-2xl font-bold text-slate-800 text-center mb-6">Rejestracja Użytkownika</h2>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{{ errorMessage }}</div>
      <div v-if="successMessage" class="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">{{ successMessage }}</div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700">Imię i nazwisko</label>
          <input v-model="fullName" type="text" required class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Adres Email</label>
          <input v-model="email" type="email" required class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700">Hasło</label>
          <input v-model="password" type="password" required class="w-full px-3 py-2 border rounded-lg" />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
          {{ isLoading ? 'Tworzenie konta...' : 'Zarejestruj się' }}
        </button>
      </form>

      <p class="text-center text-xs text-slate-500 mt-4">
        Masz już konto?
        <button @click="emit('switch-to-login')" class="text-indigo-600 font-medium hover:underline">Zaloguj się</button>
      </p>
    </div>
  </div>
</template>