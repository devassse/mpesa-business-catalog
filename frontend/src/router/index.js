import { route } from 'quasar/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import Cookies from 'js-cookie'
import { getCurrentUser } from 'boot/auth';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

const getCookie = async (name) => {
  if (isElectron) {
    return await window.electronAPI.getCookie(name)
  } else {
    return Cookies.get(name)
  }
}

// function decodeJWT(token) {
//   try {
//     const payloadBase64 = token.split('.')[1];
//     const decodedPayload = atob(payloadBase64); // decode base64
//     return JSON.parse(decodedPayload);
//   } catch (err) {
//     console.error('Token inválido:', err);
//     return null;
//   }
// }

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Global navigation guard to check authentication
  // This will redirect users to the login page if they are not authenticated
  // and prevent access to protected routes
  Router.beforeEach(async(to, from, next) => {

    // Check if the user is authenticated by looking for a token in cookies
    const token = Cookies.get('authToken')
    // const userData = await getCurrentUser(token);

    const publicPages = ['/login', '/forgot-password', '/reset-password', '/reset-password/:token', '/change-password']
    const authRequired = !publicPages.includes(to.path)

    if (authRequired && !token) {
      next('/login')
    } else if (token && to.path === '/login') {
      next('/')
    } else {
      next()
    }
  })

  return Router
})
