import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const api = axios.create({
  baseURL: API_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const getToken = () => localStorage.getItem('token');
export const getAdminToken = () => localStorage.getItem('adminToken');
export const getCustomer = () => JSON.parse(localStorage.getItem('customer') || 'null');
export const getAdmin = () => JSON.parse(localStorage.getItem('admin') || 'null');
export const setCustomer = (customer) => {
  localStorage.setItem('customer', JSON.stringify(customer));
  localStorage.setItem('has_account', 'true');
};
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('customer');
  localStorage.removeItem('admin');
};
export const hasAccount = () => localStorage.getItem('has_account') === 'true';

const token = getToken();
if (token) {
  setAuthToken(token);
}