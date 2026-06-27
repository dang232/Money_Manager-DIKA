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
  try {
    await userStore.updateProfile(form.value)
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
  } catch {
    // error already set on store
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold text-foreground">Settings</h1>

    <!-- Loading -->
    <div v-if="userStore.loading && !userStore.profile" class="text-center py-8 text-muted-foreground">
      Loading...
    </div>

    <div v-else class="rounded-xl border border-border bg-card p-6 max-w-lg space-y-5">
      <h2 class="text-lg font-semibold text-foreground">Profile</h2>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <!-- Display Name -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="displayName">Display Name</label>
          <input
            id="displayName"
            v-model="form.displayName"
            type="text"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your name"
          />
        </div>

        <!-- Locale -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground" for="locale">Locale</label>
          <select
            id="locale"
            v-model="form.locale"
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="USD">USD — US Dollar</option>
            <option value="VND">VND — Vietnamese Dong</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="JPY">JPY — Japanese Yen</option>
            <option value="SGD">SGD — Singapore Dollar</option>
          </select>
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
            class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Error -->
        <p v-if="userStore.error" class="text-sm text-destructive">{{ userStore.error }}</p>

        <!-- Success -->
        <p v-if="success" class="text-sm text-green-600 dark:text-green-400">Profile updated successfully.</p>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="userStore.loading"
          class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ userStore.loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>
    </div>
  </div>
</template>
