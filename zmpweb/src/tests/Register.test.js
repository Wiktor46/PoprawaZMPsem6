import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Register from '../components/Register.vue'

describe('Register.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders registration form', () => {
    const wrapper = mount(Register)
    expect(wrapper.find('h2').text()).toBe('Rejestracja Użytkownika')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('emits switch-to-login when login link is clicked', async () => {
    const wrapper = mount(Register)
    const loginBtn = wrapper.find('button.text-indigo-600')
    await loginBtn.trigger('click')

    expect(wrapper.emitted('switch-to-login')).toBeTruthy()
  })

  it('shows success message on successful registration', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, email: 'nowy@test.com' })
    })

    const wrapper = mount(Register)
    const inputs = wrapper.findAll('input')
    // Full name, Email, Password
    await inputs[0].setValue('Nowy Użytkownik')
    await inputs[1].setValue('nowy@test.com')
    await inputs[2].setValue('Haslo123!')
    await wrapper.find('form').trigger('submit.prevent')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    )

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Konto zostało utworzone!')
  })
})
