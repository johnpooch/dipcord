import { DIPLICITY_API_BASE_URL } from './constants';

type RequestConfig = {
  url: string;
  method: string;
  headers: { [key: string]: string };
};

const makeRequest = async (config: RequestConfig) => {
  const response = await fetch(`${DIPLICITY_API_BASE_URL}${config.url}`, {
    method: config.method,
    headers: config.headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

export { makeRequest, RequestConfig };
