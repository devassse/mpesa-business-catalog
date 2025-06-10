<template>
  <div class="q-pa-md row items-center justify-center bg-accent" style="height: 105vh">
    <q-card class="my-card" flat bordered>
      <q-card-section horizontal>
        <q-card-section class="q-pa-none q-pt-md" style="min-width: 54%">
          <q-tabs v-model="tab" align="justify" narrow-indicator class="q-mb-lg">
            <q-tab class="text-dark q-ml-md" name="forgotpassword" label="Reset Password" />
          </q-tabs>
          <q-tab-panels v-model="tab" animated transition-prev="scale" transition-next="scale"
            class="text-dark text-center q-pa-none">
            <q-tab-panel name="forgotpassword">
              <div class="text-h6 q-mt-xl">Reset Password <br /> M-Pesa Business Catalog</div>
              <div class="text-caption q-pb-lg">It Makes working fun!</div>
              <q-form style="width: 100%" @submit="onSubmit" class="q-gutter-md">
                <q-input filled dense v-model="email" label="Your email" hint="name.surname@vm.co.mz" lazy-rules
                  :rules="[(val) => (val && val.length > 0) || 'Please type something']" />
                <div class="q-mt-xl">
                  <q-btn label="Cancel" @click="backToLogin" color="negative" />
                  <q-btn label="Submit" :loading="loggingIn" unelevated type="submit" color="secondary"
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
import { forgotPassword } from 'src/boot/auth'

const router = useRouter()
const $q = useQuasar()

const tab = ref('forgotpassword')
const loggingIn = ref(false)

const email = ref(null)

const onSubmit = async () => {
  try {
    loggingIn.value = true
    const response = await forgotPassword({ email: email.value })

    console.log('Password reset response:', response);

    if (response) {
      // Show success notification
      $q.notify({
        type: 'positive',
        message: 'Password reset link sent to your email.',
        position: 'top',
        timeout: 5000,
      })
      // Redirect to login page
      router.push('/reset-password')
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
    loggingIn.value = false
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
