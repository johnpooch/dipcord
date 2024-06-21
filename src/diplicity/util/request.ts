import { DIPLICITY_API_BASE_URL } from './constants';

// Get the base URL from the environment variables if it exists, otherwise
// use production URL
const envDiplictityApiBaseUrl = process.env.DIPLICITY_API_BASE_URL;
const baseUrl =
  !envDiplictityApiBaseUrl || envDiplictityApiBaseUrl === ''
    ? DIPLICITY_API_BASE_URL
    : envDiplictityApiBaseUrl;

const baseHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export { baseUrl, baseHeaders };
