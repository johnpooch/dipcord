import { RequestConfig } from '../util/request';

const loginRequest: RequestConfig = {
  url: '/Auth/Login',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

export { loginRequest };
