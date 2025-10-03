// src/axios/axiosConfig.js
import axios from 'axios';

// 🌐 เปลี่ยน IP นี้เป็น IP ของเครื่องเพื่อนที่รัน Server
const SERVER_IP = '192.168.10.180'; // เปลี่ยนเป็น IP เครื่องเพื่อน เช่น '192.168.1.100'
const SERVER_PORT = 4000;

const api = axios.create({
  baseURL: `http://${SERVER_IP}:${SERVER_PORT}/api`,
  timeout: 10000,
});

// 🔍 เพิ่ม interceptor เพื่อ log การเชื่อมต่อ
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.message);
    if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
      console.error(`🚨 Cannot connect to server at http://${SERVER_IP}:${SERVER_PORT}`);
      console.error('Please check:');
      console.error('1. Server is running');
      console.error('2. IP address is correct');
      console.error('3. Firewall settings');
      console.error('4. CORS configuration');
    }
    return Promise.reject(error);
  }
);

export default api;