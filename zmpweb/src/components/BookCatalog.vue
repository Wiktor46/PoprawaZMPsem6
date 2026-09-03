<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  currentUser: Object,
  token: String,
  refreshTrigger: Number
})

const emit = defineEmits(['session-expired'])

const books = ref([])
const myReservations = ref([])
const myActiveLoans = ref([])
const isLoading = ref(true)
const actionMessage = ref('')

const API_BASE = 'https://poprawazmpsem6-api.onrender.com'

const checkResponseStatus = (res) => {
  if (res.status === 401) {
    emit('session-expired')
    throw new Error('Twoja sesja wygasła. Zaloguj się ponownie.')
  }
  return res
}

const fetchBooks = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/books`)
    books.value = await res.json()
  } catch (err) {
    console.error('Błąd pobierania książek:', err)
  } finally {
    isLoading.value = false
  }
}

const fetchReservations = async () => {
  if (!props.token) return
  try {
    const res = await fetch(`${API_BASE}/api/reservations`, {
      headers: { Authorization: `Bearer ${props.token}` }
    })
    checkResponseStatus(res)
    if (res.ok) {
      myReservations.value = await res.json()
    }
  } catch (err) {
    console.error('Błąd pobierania rezerwacji:', err)
  }
}

const fetchLoans = async () => {
  if (!props.token) return
  try {
    const res = await fetch(`${API_BASE}/api/loans?active=true`, {
      headers: { Authorization: `Bearer ${props.token}` }
    })
    checkResponseStatus(res)
    if (res.ok) {
      myActiveLoans.value = await res.json()
    }
  } catch (err) {
    console.error('Błąd pobierania wypożyczeń:', err)
  }
}

const reserveBook = async (bookId) => {
  actionMessage.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/books/${bookId}/reserve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${props.token}` }
    })
    checkResponseStatus(res)
    const data = await res.json()

    if (!res.ok) throw new Error(data.message || 'Nie udało się zarezerwować książki.')

    actionMessage.value = `Zostałeś dodany do kolejki (pozycja: ${data.position}). System powiadomi Cię, gdy książka będzie dostępna.`
    await fetchReservations()
  } catch (err) {
    actionMessage.value = err.message
  }
}

const checkoutBook = async (bookId) => {
  actionMessage.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/books/${bookId}/checkout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${props.token}` }
    })
    checkResponseStatus(res)
    const data = await res.json()

    if (!res.ok) throw new Error(data.message || 'Nie udało się wypożyczyć.')

    actionMessage.value = 'Książka została pomyślnie wypożyczona!'
    await fetchBooks()
    await fetchLoans()
  } catch (err) {
    actionMessage.value = err.message
  }
}

const isReservedByMe = (bookId) => {
  if (!myReservations.value || !Array.isArray(myReservations.value)) return false
  return myReservations.value.some(r => r.book && r.book.id === bookId)
}

const isBorrowedByMe = (bookId) => {
  if (!myActiveLoans.value || !Array.isArray(myActiveLoans.value)) return false
  return myActiveLoans.value.some(l => l.book && l.book.id === bookId)
}

// Reagowanie na zmianę lub załadowanie tokenu (np. przy odświeżeniu strony)
watch(
  () => props.token,
  (newToken) => {
    if (newToken) {
      fetchReservations()
      fetchLoans()
    } else {
      myReservations.value = []
      myActiveLoans.value = []
    }
  },
  { immediate: true }
)

// Reagowanie na sygnał odświeżenia w czasie rzeczywistym z SignalR
watch(
  () => props.refreshTrigger,
  () => {
    fetchBooks()
    fetchReservations()
    fetchLoans()
  }
)

onMounted(() => {
  fetchBooks()
  fetchReservations()
  fetchLoans()
})
</script>

<template>
  <div class="max-w-5xl mx-auto p-6">
    <h1 class="text-3xl font-bold text-slate-800 mb-6">Katalog Książek</h1>

    <div v-if="actionMessage" class="mb-6 p-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
      {{ actionMessage }}
    </div>

    <div v-if="isLoading" class="text-center py-8">Ładowanie książek...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="book in books" :key="book.id" class="bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-lg font-bold text-slate-900">{{ book.title }}</h3>
            <span :class="book.isAvailable ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'" class="px-2.5 py-1 rounded-full text-xs font-semibold">
              {{ book.isAvailable ? 'Dostępna' : 'Niedostępna' }}
            </span>
          </div>
          <p class="text-sm text-slate-600 mb-1">Autor: {{ book.author }}</p>
          <p class="text-xs text-slate-400 mb-4">ISBN: {{ book.isbn }}</p>
        </div>

        <!-- Sekcja akcji z uwzględnieniem statusu zalogowania -->
        <div class="mt-4 pt-4 border-t border-slate-100">
          <div v-if="currentUser">
            <!-- Dostępna książka -> Wypożycz -->
            <button v-if="book.isAvailable" @click="checkoutBook(book.id)" class="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
              Wypożycz online
            </button>

            <!-- Niedostępna książka -> Rezerwacja / Posiadanie / Oczekiwanie -->
            <div v-else>
              <div v-if="isBorrowedByMe(book.id)" class="text-center text-xs font-medium text-indigo-600 py-2 bg-indigo-50 rounded-lg">
                📖 Masz obecnie wypożyczoną tę książkę
              </div>
              <button v-else-if="!isReservedByMe(book.id)" @click="reserveBook(book.id)" class="w-full py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">
                Oczekuj na książkę (Dołącz do kolejki)
              </button>
              <div v-else class="text-center text-xs font-medium text-amber-600 py-2 bg-amber-50 rounded-lg">
                Jesteś w kolejce oczekujących
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-slate-400 text-center py-2">
            Zaloguj się, aby zarezerwować lub wypożyczyć.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>