import Vue from 'vue'
import App from './App'
import router from './router'
import 'at-ui-style'
import AtUI from 'at-ui'
import axios from 'axios'


Vue.config.productionTip = false
Vue.use(AtUI)
Vue.prototype.$http = axios
Vue.prototype.$currentSite = ''


/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App),
  beforeCreate: function() {
  },
  created: function() {
  },
})

