import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/styles/globals.css'
import ToastContainer from '@/components/ToastContainer.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('ToastContainer', ToastContainer)

app.mount('#app')
