import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Login from '../components/Login.vue'

describe('Login.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders login form properly', () => {
    const wrapper = mount(Login)
    expect(wrapper.find('h1').text()).toBe('Portal Biblioteki')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('emits switch-to-register when register link is clicked', async () => {
    const wrapper = mount(Login)
    const registerBtn = wrapper.find('button.text-indigo-600')
    await registerBtn.trigger('click')

    expect(wrapper.emitted('switch-to-register')).toBeTruthy()
  })

  it('emits login-success with user data on valid login', async () => {
    const fakeUserData = {
      token: 'fake-jwt-token',
      email: 'user@test.com',
      fullName: 'Jan Testowy',
      role: 'User'
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeUserData
    })

    const wrapper = mount(Login)
    await wrapper.find('input[type="email"]').setValue('user@test.com')
    await wrapper.find('input[type="password"]').setValue('Password123!')
    await wrapper.find('form').trigger('submit.prevent')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    expect(wrapper.emitted('login-success')).toBeTruthy()
    expect(wrapper.emitted('login-success')[0][0]).toEqual(fakeUserData)
  })

  it('displays error message on failed login', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Nieprawidłowy e-mail lub hasło.' })
    })

    const wrapper = mount(Login)
    await wrapper.find('input[type="email"]').setValue('bad@test.com')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('form').trigger('submit.prevent')

    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Nieprawidłowy e-mail lub hasło.')
  })
})
