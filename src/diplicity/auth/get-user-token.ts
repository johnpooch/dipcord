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

const getUserToken = async (userId: string, botToken: string) => {
  const response = await fetch(
    `${baseUrl}/Auth/${userId}/TokenForDiscordUser`,
    {
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${botToken}` },
    },
  );

  if (!response.ok) {
    throw new Error(
      `HTTP error! Message: ${response.text}; Status: ${response.status}`,
    );
  }

  return transformResponse(await response.json());
};

export { getUserToken };
