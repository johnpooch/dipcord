import { baseHeaders, baseUrl } from '../util/request';

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = {
  Properties: string;
};

type TransformedResponse = {
  token: string;
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  const { Properties } = response as DiplicityResponse;
  return { token: Properties };
};

const login = async () => {

  const USERNAME = process.env.DISCORD_BOT_USERNAME;
  if (!USERNAME || USERNAME === '') {
    throw new Error('DISCORD_BOT_USERNAME environment variable is required');
  }

  const PASSWORD = process.env.DISCORD_BOT_PASSWORD;
  if (!PASSWORD || PASSWORD === '') {
    throw new Error('DISCORD_BOT_PASSWORD environment variable is required');
  }

  const token = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

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
