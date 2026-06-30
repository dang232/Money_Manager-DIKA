<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, AlertCircle, Loader2 } from '@lucide/vue'

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
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div class="w-full max-w-sm animate-fade-up">

      <!-- Brand -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4" aria-hidden="true">
          <Wallet :size="24" class="text-primary" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">Create an account</h1>
        <p class="text-sm text-muted-foreground mt-1">Start tracking your finances</p>
      </div>

      <!-- Form card -->
      <div class="rounded-xl border border-border bg-card shadow-sm p-6">
        <form class="space-y-4" @submit.prevent="handleRegister" novalidate>

          <div class="space-y-1.5">
            <Label for="displayName">Display name</Label>
            <Input id="displayName" v-model="displayName" placeholder="Your name" :aria-invalid="!!error" />
          </div>

          <div class="space-y-1.5">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" placeholder="you@example.com" :aria-invalid="!!error" />
          </div>

          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" placeholder="••••••••" :aria-invalid="!!error" />
            <p class="text-xs text-muted-foreground">Min 8 characters</p>
          </div>

          <!-- Error message -->
          <div
            v-if="error"
            role="alert"
            aria-live="polite"
            class="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle :size="16" class="mt-0.5 shrink-0" />
            {{ error }}
          </div>

          <Button type="submit" :disabled="loading" class="w-full mt-2">
            <Loader2 v-if="loading" :size="16" class="animate-spin" />
            {{ loading ? 'Creating account…' : 'Create account' }}
          </Button>
        </form>
      </div>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?
        <router-link to="/login" class="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">Sign in</router-link>
      </p>
    </div>
  </div>
</template>
