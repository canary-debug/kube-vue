<template>
  <div class="page">
    <div class="left" :style="{ background: `linear-gradient(135deg, ${primaryColor}e6, ${primaryColor}, ${primaryColor}cc)` }">
      <div class="brand">
        <div class="brand-icon"><Sparkles :size="16" /></div>
        <span>{{ brandName }}</span>
      </div>
      <div class="characters-area">
        <AnimatedCharacters
          :is-typing="isTyping"
          :has-secret="!!password"
          :secret-visible="showPassword"
        />
      </div>
      <div class="footer-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Contact</a>
      </div>
      <div class="deco-grid" />
      <div class="deco-circle deco-circle-1" />
      <div class="deco-circle deco-circle-2" />
    </div>
    <div class="right">
      <div class="form-wrapper">
        <div class="mobile-brand">
          <div class="brand-icon"><Sparkles :size="16" /></div>
          <span>{{ brandName }}</span>
        </div>
        <div class="header">
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <form @submit.prevent="onSubmit" class="form">
          <div class="field">
            <label for="login-email">Email</label>
            <input id="login-email" type="email" :placeholder="emailPlaceholder" v-model="email"
              autocomplete="off" @focus="isTyping = true" @blur="isTyping = false" required />
          </div>
          <div class="field">
            <label for="login-password">Password</label>
            <div class="password-wrap">
              <input id="login-password" :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••" v-model="password" required />
              <button type="button" class="eye-btn" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="20" />
                <Eye v-else :size="20" />
              </button>
            </div>
          </div>
          <div class="options">
            <label class="remember"><input type="checkbox" v-model="remember" /> Remember for 30 days</label>
            <a href="#" class="forgot">Forgot password?</a>
          </div>
          <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          <button type="submit" class="btn-primary" :disabled="loading"
            :style="{ background: primaryColor }">
            {{ loading ? 'Signing in...' : 'Log in' }}
          </button>
        </form>
        <button v-if="showGoogleLogin" type="button" class="btn-google">
          <Mail :size="20" /> Log in with Google
        </button>
        <p class="signup-link">Don't have an account? <a href="#">Sign Up</a></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff, Mail, Sparkles } from 'lucide-vue-next'
import AnimatedCharacters from './AnimatedCharacters.vue'

const props = withDefaults(defineProps<{
  brandName?: string
  title?: string
  subtitle?: string
  emailPlaceholder?: string
  primaryColor?: string
  showGoogleLogin?: boolean
}>(), {
  brandName: 'YourBrand',
  title: 'Welcome back!',
  subtitle: 'Please enter your details',
  emailPlaceholder: 'example@mail.com/name',
  primaryColor: '#4f46e5',
  showGoogleLogin: true,
})

const emit = defineEmits<{
  submit: [payload: { email: string; password: string; remember: boolean }]
}>()

const showPassword = ref(false)
const email = ref('')
const password = ref('')
const remember = ref(false)
const errorMsg = ref('')
const loading = ref(false)
const isTyping = ref(false)

/** Expose for parent to control error/loading state */
defineExpose({
  setError: (msg: string) => { errorMsg.value = msg },
  setLoading: (v: boolean) => { loading.value = v },
})

function onSubmit() {
  errorMsg.value = ''
  emit('submit', {
    email: email.value,
    password: password.value,
    remember: remember.value,
  })
}
</script>

<style scoped>
.page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
.left {
  position: relative; display: flex; flex-direction: column; justify-content: space-between;
  padding: 48px; color: white; overflow: hidden;
}
.brand { position: relative; z-index: 20; display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; }
.brand-icon {
  width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
}
.characters-area { position: relative; z-index: 20; display: flex; align-items: flex-end; justify-content: center; height: 500px; }
.footer-links { position: relative; z-index: 20; display: flex; gap: 32px; font-size: 14px; }
.footer-links a { color: rgba(255,255,255,0.6); transition: color 0.2s; }
.footer-links a:hover { color: white; }
.deco-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}
.deco-circle { position: absolute; border-radius: 50%; filter: blur(48px); }
.deco-circle-1 { top: 25%; right: 25%; width: 256px; height: 256px; background: rgba(255,255,255,0.1); }
.deco-circle-2 { bottom: 25%; left: 25%; width: 384px; height: 384px; background: rgba(255,255,255,0.05); }
.right { display: flex; align-items: center; justify-content: center; padding: 32px; background: #fff; }
.form-wrapper { width: 100%; max-width: 420px; }
.mobile-brand { display: none; }
.header { text-align: center; margin-bottom: 40px; }
.header h1 { font-size: 30px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 8px; }
.header p { color: #71717a; font-size: 14px; }
.form { display: flex; flex-direction: column; gap: 20px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 14px; font-weight: 500; }
.field input {
  height: 48px; padding: 0 12px; border-radius: 6px; border: 1px solid #d4d4d8;
  font-size: 14px; outline: none; background: #fff; transition: border-color 0.2s;
}
.field input:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.2); }
.password-wrap { position: relative; }
.password-wrap input { width: 100%; padding-right: 40px; }
.eye-btn {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  background: none; border: none; color: #a1a1aa; transition: color 0.2s;
}
.eye-btn:hover { color: #3f3f46; }
.options { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
.remember { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.remember input { width: 16px; height: 16px; accent-color: #4f46e5; }
.forgot { color: #4f46e5; font-weight: 500; }
.forgot:hover { text-decoration: underline; }
.error-msg {
  padding: 12px; font-size: 14px; color: #f87171;
  background: rgba(127,29,29,0.08); border: 1px solid rgba(127,29,29,0.15); border-radius: 8px;
}
.btn-primary {
  width: 100%; height: 48px; font-size: 16px; font-weight: 500; border: none; border-radius: 6px;
  color: white; transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-google {
  width: 100%; height: 48px; margin-top: 24px; display: flex; align-items: center;
  justify-content: center; gap: 8px; border-radius: 6px; border: 1px solid #d4d4d8;
  background: #fff; font-size: 14px; transition: background 0.2s;
}
.btn-google:hover { background: #fafafa; }
.signup-link { text-align: center; font-size: 14px; color: #71717a; margin-top: 32px; }
.signup-link a { color: #18181b; font-weight: 500; }
.signup-link a:hover { text-decoration: underline; }
@media (max-width: 1023px) {
  .page { grid-template-columns: 1fr; }
  .left { display: none; }
  .mobile-brand { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 18px; font-weight: 600; margin-bottom: 48px; }
}
</style>
