import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'vfonts/Lato.css';
import './assets/styles/index.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount('#app');
