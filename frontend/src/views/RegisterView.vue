<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const displayName = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (!email.value || !password.value || !displayName.value) {
    error.value = 'Please fill in all fields.'
    return
  }
  loading.value = true
  try {
    await authStore.register(email.value, password.value, displayName.value)
    router.push('/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-bold text-foreground">Create an account</h1>
        <p class="text-sm text-muted-foreground mt-1">Start tracking your finances</p>
      </div>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div class="space-y-1">
          <label for="displayName" class="text-sm font-medium text-foreground">Display name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            placeholder="Your name"
            autocomplete="name"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div class="space-y-1">
          <label for="email" class="text-sm font-medium text-foreground">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div class="space-y-1">
          <label for="password" class="text-sm font-medium text-foreground">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 transition-opacity"
        >
          {{ loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?
        <router-link to="/login" class="text-primary hover:underline font-medium">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
