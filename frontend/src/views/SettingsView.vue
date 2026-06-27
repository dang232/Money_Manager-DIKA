<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/stores/user.store'
import type { UpdateProfileDto } from '@/api/user.api'
import { Check } from '@lucide/vue'

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
const activeSection = ref('Profile')
const sections = ['Profile', 'Accounts', 'Categories', 'Notifications', 'Security', 'Currency', 'Export Data']

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
  <div class="space-y-6 pb-8">
    <!-- Page Header -->
    <div>
      <h1 class="font-display text-[28px] font-extrabold tracking-tight text-foreground">Settings</h1>
      <p class="text-sm text-muted-foreground mt-1">Manage your profile, accounts and preferences</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
      <!-- Settings Sidebar -->
      <aside class="space-y-1">
        <button
          v-for="section in sections"
          :key="section"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-150"
          :class="activeSection === section ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
          @click="activeSection = section"
        >
          {{ section }}
        </button>
      </aside>

      <!-- Content -->
      <div>
        <!-- Loading skeleton -->
        <div
          v-if="userStore.loading && !userStore.profile"
          class="rounded-2xl border border-border bg-card p-6 space-y-5 animate-pulse"
          aria-busy="true"
          aria-label="Loading settings"
        >
          <div class="h-5 w-24 rounded bg-muted" />
          <div class="space-y-3">
            <div class="h-4 w-32 rounded bg-muted" />
            <div class="h-10 rounded-xl bg-muted" />
          </div>
          <div class="space-y-3">
            <div class="h-4 w-20 rounded bg-muted" />
            <div class="h-10 rounded-xl bg-muted" />
          </div>
        </div>

        <form v-else class="space-y-6" @submit.prevent="handleSubmit" novalidate>
          <!-- Profile Section -->
          <div class="bg-card rounded-2xl border border-border p-6">
            <h3 class="font-display text-lg font-bold text-foreground mb-6">Profile Information</h3>

            <!-- Avatar Row -->
            <div class="flex items-center gap-5 pb-6 border-b border-border/50 mb-6">
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-[28px] shadow-sm shrink-0">
                {{ form.displayName ? form.displayName.charAt(0).toUpperCase() : 'D' }}
              </div>
              <div class="flex-1">
                <h4 class="font-display text-base font-bold text-foreground">{{ form.displayName || 'User' }}</h4>
                <p class="text-[13px] text-muted-foreground">user@email.com</p>
              </div>
              <button type="button" class="px-4 py-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Change photo
              </button>
            </div>

            <!-- Display Name -->
            <div class="space-y-1.5 mb-4">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider" for="displayName">Display Name</label>
              <input
                id="displayName"
                v-model="form.displayName"
                type="text"
                class="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="Your name"
                autocomplete="name"
              />
            </div>

            <!-- Regional fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider" for="defaultCurrency">Currency</label>
                <select
                  id="defaultCurrency"
                  v-model="form.defaultCurrency"
                  class="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="VND">🇻🇳 Vietnamese Dong (₫)</option>
                  <option value="USD">🇺🇸 US Dollar ($)</option>
                  <option value="EUR">🇪🇺 Euro (€)</option>
                  <option value="GBP">🇬🇧 British Pound (£)</option>
                  <option value="JPY">🇯🇵 Japanese Yen (¥)</option>
                  <option value="SGD">🇸🇬 Singapore Dollar (S$)</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider" for="locale">Language</label>
                <select
                  id="locale"
                  v-model="form.locale"
                  class="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                >
                  <option value="vi-VN">Tiếng Việt</option>
                  <option value="en-US">English</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="ja-JP">Japanese</option>
                </select>
              </div>
            </div>

            <!-- Timezone -->
            <div class="space-y-1.5 mb-4">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider" for="timezone">Timezone</label>
              <select
                id="timezone"
                v-model="form.timezone"
                class="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (ICT)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (ET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <!-- Budget Anchor Day -->
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider" for="budgetAnchorDay">
                Budget Anchor Day <span class="normal-case">(1–28)</span>
              </label>
              <input
                id="budgetAnchorDay"
                v-model.number="form.budgetAnchorDay"
                type="number"
                min="1"
                max="28"
                class="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="userStore.error"
            role="alert"
            class="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {{ userStore.error }}
          </div>

          <!-- Success -->
          <div
            v-if="success"
            role="status"
            aria-live="polite"
            class="flex items-center gap-2 rounded-xl border border-income/30 bg-income-bg px-4 py-3 text-sm text-income"
          >
            <Check :size="16" />
            Settings saved
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <button
              type="submit"
              :disabled="saving || userStore.loading"
              class="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-primary/90 transition-all flex items-center gap-2"
            >
              <svg
                v-if="saving"
                class="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
