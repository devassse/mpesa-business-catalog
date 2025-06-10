<template>
  <div class="q-pa-md row items-center justify-center bg-accent" style="height: 105vh">
    <q-card class="my-card" flat bordered>
      <q-card-section horizontal>
        <q-card-section class="q-pa-none q-pt-md" style="min-width: 54%">
          <q-tabs v-model="tab" align="justify" narrow-indicator class="q-mb-lg">
            <q-tab class="text-dark q-ml-md" name="resetpassword" label="Reset Password" />
          </q-tabs>
          <q-tab-panels v-model="tab" animated transition-prev="scale" transition-next="scale"
            class="text-dark text-center q-pa-none">
            <q-tab-panel name="resetpassword">
              <div class="text-h6 q-mt-xl">Reset Password <br /> M-Pesa Business Catalog</div>
              <div class="text-caption q-pb-lg">It Makes working fun!</div>
              <q-form style="width: 100%" @submit="onSubmit" class="q-gutter-md">


                <q-input filled dense :type="isPwd ? 'password' : 'text'" v-model="password" label="New Password"
                  hint="Your passowrd" lazy-rules :rules="[
                    (val) => (val && val.length > 0) || 'Please enter your password',
                    (val) => val.length >= 8 || 'Password must be at least 8 characters long',
                  ]">
                  <template v-slot:append>
                    <q-icon size="20px" :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="isPwd = !isPwd" />
                  </template>
                </q-input>
                <q-input filled dense :type="isRePwd ? 'password' : 'text'" v-model="repassword"
                  label="Confirm New Password" hint="Confirm passowrd" lazy-rules :rules="[
                    (val) => (val && val.length > 0) || 'Please confirm your password',
                    (val) => val === password || 'Passwords do not match',
                  ]">
                  <template v-slot:append>
                    <q-icon size="20px" :name="isRePwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                      @click="isRePwd = !isRePwd" />
                  </template>
                </q-input>


                <div class="q-mt-xl">
                  <q-btn label="Cancel" @click="backToLogin" color="negative" />
                  <q-btn label="Submit" :loading="resettingPassword" unelevated type="submit" color="secondary"
                    class="q-ml-sm" />
                </div>
              </q-form>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
        <q-img style="min-height: 500px;" class="col-5 q-ma-md q-ml-none" :src="loginImage">
          <div class="text-caption text-uppercase img-card q-pt-xl">
            "Unlocking the full potential of our corporate with the M-Pesa Business Catalog, your comprehensive digital
            resource for managing and optimizing every aspect of your operations."
          </div>
        </q-img>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import loginImage from 'src/assets/login.webp'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { resetPassword } from 'src/boot/auth'

const router = useRouter()
const $q = useQuasar()

const tab = ref('resetpassword')
const resettingPassword = ref(false)

const password = ref(null)
const repassword = ref(null)
const isPwd = ref(true)
const isRePwd = ref(true)

const onSubmit = async () => {
  try {
    resettingPassword.value = true
    const token = router.currentRoute.value.query.token
    if (!token) {
      $q.notify({
        type: 'negative',
        message: 'Invalid or missing token.',
        position: 'top',
        timeout: 3000,
      })
      resettingPassword.value = false
      return
    }

    const response = await resetPassword({ password: password.value, token: token })
    if (response) {
      // Show success notification
      $q.notify({
        type: 'positive',
        message: 'Password Reset Success.',
        position: 'top',
        timeout: 3000,
      })

      // Redirect to login page
      router.push('/login')
    } else {
      // Show error notification
      $q.notify({
        type: 'negative',
        message: `Error resetting password: ${response.error || 'Unknown error'}`,
        position: 'top',
        timeout: 3000,
      })
    }
  } catch (error) {
    resettingPassword.value = false
    console.log('Error during password reset:', error);
    // Show error notification
    $q.notify({
      type: 'negative',
      message: `Error resetting password: ${error?.response?.data?.error || 'Unknown error'}`,
      position: 'top',
      timeout: 3000,
    })

  }



  // if (response.success) {
  //   // Show success message and redirect to login
  //   router.push('/login')
  // } else {
  //   // Handle error (e.g., show a notification)
  //   console.error('Error resetting password:', response.error)
  // }

}

const backToLogin = () => {
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.my-card {
  width: 100%;
  max-width: 800px;
  min-height: 500px;
}

.img-card {
  bottom: 0;
  background: rgb(2, 0, 36);
  background: linear-gradient(0deg, rgba(2, 0, 36, 1) 0%, rgba(0, 0, 0, 0.7581626400560224) 54%, rgba(34, 34, 34, 0) 100%);
}
</style>
