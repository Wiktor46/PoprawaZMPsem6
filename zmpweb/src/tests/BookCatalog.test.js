import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import BookCatalog from '../components/BookCatalog.vue'

describe('BookCatalog.vue', () => {
  const fakeBooks = [
    { id: 1, title: 'Wiedźmin', author: 'Andrzej Sapkowski', isbn: '111', isAvailable: true },
    { id: 2, title: 'Solaris', author: 'Stanisław Lem', isbn: '222', isAvailable: false },
    { id: 3, title: 'Lalka', author: 'Bolesław Prus', isbn: '333', isAvailable: false },
    { id: 4, title: 'Diuna', author: 'Frank Herbert', isbn: '444', isAvailable: false }
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/books')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => fakeBooks
        })
      }
      if (url.includes('/api/reservations')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, book: { id: 2 } } // Solaris is reserved by me
          ]
        })
      }
      if (url.includes('/api/loans')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => [
            { id: 1, book: { id: 4 } } // Diuna is borrowed by me
          ]
        })
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => [] })
    })
  })

  it('renders list of books with availability badges', async () => {
    const wrapper = mount(BookCatalog, {
      props: { currentUser: null, token: '' }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Wiedźmin')
    expect(wrapper.text()).toContain('Solaris')
    expect(wrapper.text()).toContain('Dostępna')
    expect(wrapper.text()).toContain('Niedostępna')
  })

  it('shows login prompt for guest users', async () => {
    const wrapper = mount(BookCatalog, {
      props: { currentUser: null, token: '' }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Zaloguj się, aby zarezerwować lub wypożyczyć.')
  })

  it('shows "Wypożycz online" button for available book when user is logged in', async () => {
    const wrapper = mount(BookCatalog, {
      props: {
        currentUser: { id: 1, email: 'user@test.com' },
        token: 'valid-token'
      }
    })

    await flushPromises()

    const checkoutBtn = wrapper.findAll('button').find(b => b.text().includes('Wypożycz online'))
    expect(checkoutBtn).toBeDefined()
    expect(checkoutBtn.text()).toBe('Wypożycz online')
  })

  it('shows "Jesteś w kolejce oczekujących" for reserved book', async () => {
    const wrapper = mount(BookCatalog, {
      props: {
        currentUser: { id: 1, email: 'user@test.com' },
        token: 'valid-token'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Jesteś w kolejce oczekujących')
  })

  it('shows "📖 Masz obecnie wypożyczoną tę książkę" for book borrowed by current user', async () => {
    const wrapper = mount(BookCatalog, {
      props: {
        currentUser: { id: 1, email: 'user@test.com' },
        token: 'valid-token'
      }
    })

    await flushPromises()

    expect(wrapper.text()).toContain('Masz obecnie wypożyczoną tę książkę')
  })

  it('shows "Oczekuj na książkę" button for unavailable book not borrowed or reserved by me', async () => {
    const wrapper = mount(BookCatalog, {
      props: {
        currentUser: { id: 1, email: 'user@test.com' },
        token: 'valid-token'
      }
    })

    await flushPromises()

    const reserveBtn = wrapper.findAll('button').find(b => b.text().includes('Oczekuj na książkę'))
    expect(reserveBtn).toBeDefined()
  })
})
