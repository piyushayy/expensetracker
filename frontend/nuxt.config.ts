// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Expense Tracker - Premium Expense Tracker',
      meta: [
        { name: 'description', content: 'A sleek, modern, glassmorphic dark-theme expense tracker built with Nuxt 3 and FastAPI.' }
      ]
    }
  },
  routeRules: {
    '/api/**': { proxy: 'http://127.0.0.1:8000/**' }
  }
})

