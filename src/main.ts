import './assets/main.css'
import './components/project/Projects.css'
import './components/folder/FolderCard.css'
import './components/ui/AtelierModal.css'
import './components/ui/ModalScrollbars.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
