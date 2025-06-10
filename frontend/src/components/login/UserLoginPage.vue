<template>
  <div class="q-pa-none" style="
      height: 100%;
      display: flex;
      align-items: center;
      flex-direction: column;
      justify-content: center;
    ">
    <q-form style="width: 100%" @submit="onSubmit" @reset="onReset" class="q-gutter-md">
      <q-input filled dense v-model="name" label="Your email" hint="name.surname@vm.co.mz" lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']" />
      <q-input dense v-model="password" label="Your password" filled :type="isPwd ? 'password' : 'text'"
        hint="Password">
        <template v-slot:append>
          <q-icon size="20px" :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
            @click="isPwd = !isPwd" />
        </template>
      </q-input>
      <div class="q-mt-md text-right">
        <q-btn flat color="secondary" no-caps
        type="button"
          @click="forgotPassword">
          Forgot Password?
        </q-btn>
        Don't have an account? <q-btn dense flat no-caps color="secondary" @click="activateSigninTab">Sign up</q-btn>
      </div>
      <div class="q-mt-xl">
        <q-btn label="Reset" type="reset" color="negative" />
        <q-btn label="Submit" :loading="loggingIn" unelevated type="submit" color="secondary" class="q-ml-sm" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue'
import Cookies from 'js-cookie'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { login } from 'src/boot/auth'

const emit = defineEmits(['sign-up-tab'])

const $q = useQuasar()
const router = useRouter()
const name = ref(null)
const password = ref('')
const isPwd = ref(true)
const isElectron = ref(false)

const loggingIn = ref(false)

const activateSigninTab = () => {
  emit('sign-up-tab', 'register')
}

const forgotPassword = () => {
  router.push('/forgot-password')
}

onMounted(() => {
  isElectron.value = !!window.electronAPI
})

const onReset = () => {
  name.value = null
  password.value = ''
  isPwd.value = true
}

const setCookie = async (name, value, days, minutes = 0) => {
  const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000 + minutes * 60 * 1000)

  if (isElectron.value) {
    await window.electronAPI.setCookie(name, value, days, minutes)
  } else {
    Cookies.set(name, value, { expires: expirationDate })
  }
}

const onSubmit = async () => {
  loggingIn.value = true
  try {
    const response = await login({ email: name.value, password: password.value })

    // Set the token in a cookie
    await setCookie('authToken', response.token, 0, 60 * 4) // Expires in 180 minutes
    router.push('/')

    loggingIn.value = false

    // Show success notification
    $q.notify({
      type: 'positive',
      message: 'Login successful',
      position: 'top',
      timeout: 2000,
    })
  } catch (error) {
    console.error('Error during login:', error)
    loggingIn.value = false
    // Show error notification
    $q.notify({
      type: 'negative',
      message: 'Login failed. Please check your credentials and try again.',
      position: 'top',
      timeout: 3000,
    })
  }
}
</script>

<style scoped>
.my-card {
  max-width: 400px;
  margin: auto;
}
</style>
