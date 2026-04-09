import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

// CSS entry point (theme tokens → base styles → Tailwind)
import './assets/css/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Intentar restaurar sesión antes de montar la app
const auth = useAuthStore()
auth.initialize().finally(() => {
  app.mount('#app')
})
