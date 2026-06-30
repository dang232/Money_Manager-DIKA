<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user.store'
import { useAuthStore } from '@/stores/auth.store'
import type { UpdateProfileDto } from '@/api/user.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Loader2, AlertCircle } from '@lucide/vue'

const userStore = useUserStore()
const authStore = useAuthStore()

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

const userEmail = computed(() => authStore.user?.email ?? '')

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
        <Button
          v-for="section in sections"
          :key="section"
          variant="ghost"
          class="w-full justify-start"
          :class="activeSection === section ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground'"
          @click="activeSection = section"
        >
          {{ section }}
        </Button>
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
              <div class="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-[28px] shadow-sm shrink-0 overflow-hidden">
                <img v-if="userStore.profile?.avatarUrl" :src="userStore.profile.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                <span v-else>{{ form.displayName ? form.displayName.charAt(0).toUpperCase() : 'D' }}</span>
              </div>
              <div class="flex-1">
                <h4 class="font-display text-base font-bold text-foreground">{{ form.displayName || 'User' }}</h4>
                <p class="text-[13px] text-muted-foreground">{{ userEmail || 'user@email.com' }}</p>
              </div>
            </div>

            <!-- Display Name -->
            <div class="space-y-1.5 mb-4">
              <Label for="displayName">Display Name</Label>
              <Input id="displayName" v-model="form.displayName" placeholder="Your name" />
            </div>

            <!-- Regional fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="space-y-1.5">
                <Label for="defaultCurrency">Currency</Label>
                <select
                  id="defaultCurrency"
                  v-model="form.defaultCurrency"
                  class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
                >
                  <option value="VND">Vietnamese Dong (₫)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                  <option value="JPY">Japanese Yen (¥)</option>
                  <option value="SGD">Singapore Dollar (S$)</option>
                </select>
              </div>
              <div class="space-y-1.5">
                <Label for="locale">Language</Label>
                <select
                  id="locale"
                  v-model="form.locale"
                  class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
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
              <Label for="timezone">Timezone</Label>
              <select
                id="timezone"
                v-model="form.timezone"
                class="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary"
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
              <Label for="budgetAnchorDay">Budget Anchor Day (1–28)</Label>
              <Input
                id="budgetAnchorDay"
                :model-value="form.budgetAnchorDay"
                type="number"
                @update:model-value="form.budgetAnchorDay = Number($event)"
              />
            </div>
          </div>

          <!-- Error -->
          <div
            v-if="userStore.error"
            role="alert"
            class="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle :size="16" class="mt-0.5 shrink-0" />
            {{ userStore.error }}
          </div>

          <!-- Success -->
          <div
            v-if="success"
            role="status"
            aria-live="polite"
            class="flex items-center gap-2 rounded-xl border border-income/30 bg-income/10 px-4 py-3 text-sm text-income"
          >
            <Check :size="16" />
            Settings saved
          </div>

          <!-- Actions -->
          <div class="flex gap-3">
            <Button type="submit" :disabled="saving || userStore.loading">
              <Loader2 v-if="saving" :size="16" class="animate-spin" />
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </Button>
            <Button type="button" variant="outline" @click="userStore.fetchProfile()">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
