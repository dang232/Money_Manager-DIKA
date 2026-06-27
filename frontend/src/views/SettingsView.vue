<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user.store'
import type { UpdateProfileDto } from '@/api/user.api'

const userStore = useUserStore()

const form = ref<UpdateProfileDto>({
  displayName: '',
  locale: 'en-US',
  timezone: 'UTC',
  defaultCurrency: 'USD',
  budgetAnchorDay: 1,
})

const success = ref(false)
const saving = ref(false)

// Populate form once profile loads
watch(
  () => userStore.profile,
  (p) => {
    if (!p) return
    form.value = {
      displayName: p.displayName,
      locale: p.locale,
      timezone: p.timezone,
      defaultCurrency: p.defaultCurrency,
      budgetAnchorDay: p.budgetAnchorDay,
    }
  },
  { immediate: true },
)

onMounted(() => {
  userStore.fetchProfile()
})

async function handleSubmit() {
  success.value = false
  saving.value = true
  try {
    await userStore.updateProfile(form.value)
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch {
    // error already set on store
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-lg">
    <!-- Page heading -->
    <div>
      <h1 class="text-2xl font-bold text-foreground">Settings</h1>
      <p class="mt-1 text-sm text-muted-foreground">Manage your profile and preferences</p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="userStore.loading && !userStore.profile"
      class="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 animate-pulse"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div class="h-5 w-24 rounded bg-muted" />
      <div class="space-y-3">
        <div class="h-4 w-32 rounded bg-muted" />
        <div class="h-10 rounded-md bg-muted" />
      </div>
      <div class="space-y-3">
        <div class="h-4 w-20 rounded bg-muted" />
        <div class="h-10 rounded-md bg-muted" />
      </div>
      <div class="space-y-3">
        <div class="h-4 w-28 rounded bg-muted" />
        <div class="h-10 rounded-md bg-muted" />
      </div>
    </div>

    <form
      v-else
      class="space-y-6"
      @submit.prevent="handleSubmit"
      novalidate
    >
      <!-- Profile section -->
      <div class="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
        <div>
          <h2 class="text-base font-semibold text-foreground">Profile</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Your public display information</p>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="displayName">Display Name</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            class="w-full h-10 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground"
            placeholder="Your name"
            autocomplete="name"
          />
        </div>
      </div>

      <!-- Regional section -->
      <div class="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
        <div>
          <h2 class="text-base font-semibold text-foreground">Regional</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Locale, timezone, and currency settings</p>
        </div>

        <!-- Locale -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="locale">Locale</label>
          <select
            id="locale"
            v-model="form.locale"
            class="w-full h-10 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground"
          >
            <option value="en-US">English (US)</option>
            <option value="vi-VN">Vietnamese (VN)</option>
            <option value="fr-FR">French (FR)</option>
            <option value="de-DE">German (DE)</option>
            <option value="ja-JP">Japanese (JP)</option>
          </select>
        </div>

        <!-- Timezone -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="timezone">Timezone</label>
          <select
            id="timezone"
            v-model="form.timezone"
            class="w-full h-10 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York (ET)</option>
            <option value="America/Chicago">America/Chicago (CT)</option>
            <option value="America/Denver">America/Denver (MT)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
            <option value="Europe/Paris">Europe/Paris (CET)</option>
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
          </select>
        </div>

        <!-- Default Currency -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="defaultCurrency">Default Currency</label>
          <select
            id="defaultCurrency"
            v-model="form.defaultCurrency"
            class="w-full h-10 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="VND">VND — Vietnamese Dong</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="JPY">JPY — Japanese Yen</option>
            <option value="SGD">SGD — Singapore Dollar</option>
          </select>
        </div>
      </div>

      <!-- Budget section -->
      <div class="rounded-xl border border-border bg-card shadow-sm p-6 space-y-4">
        <div>
          <h2 class="text-base font-semibold text-foreground">Budget</h2>
          <p class="text-xs text-muted-foreground mt-0.5">Configure your monthly budget cycle</p>
        </div>

        <!-- Budget Anchor Day -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="budgetAnchorDay">
            Budget Anchor Day
            <span class="text-xs text-muted-foreground">(1–28)</span>
          </label>
          <input
            id="budgetAnchorDay"
            v-model.number="form.budgetAnchorDay"
            type="number"
            min="1"
            max="28"
            class="w-full h-10 rounded-md border border-border bg-background px-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:border-muted-foreground"
          />
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="userStore.error"
        role="alert"
        class="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      >
        {{ userStore.error }}
      </div>

      <!-- Success toast -->
      <div
        v-if="success"
        role="status"
        aria-live="polite"
        class="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
      >
        <!-- Check icon -->
        <svg class="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd" />
        </svg>
        Settings saved
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="saving || userStore.loading"
        class="h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity flex items-center gap-2"
        aria-label="Save settings"
      >
        <!-- Spinner -->
        <svg
          v-if="saving"
          class="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
    </form>
  </div>
</template>
