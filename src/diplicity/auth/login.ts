import { baseHeaders, baseUrl } from '../util/request';

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = {
  Properties: string;
};

type TransformedResponse = {
  token: string;
};

const USERNAME = 'username';
const PASSWORD = 'password';

const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  const { Properties } = response as DiplicityResponse;
  return { token: Properties };
};

const login = async () => {
  const response = await fetch(`${baseUrl}/Auth/DiscordBotLogin`, {
    method: 'GET',
    headers: { ...baseHeaders, Authorization: `Basic ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! Message: ${response.text}; Status: ${response.status}`,
    );
  }

  return transformResponse(await response.json());
};

export { login };
