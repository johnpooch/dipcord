import { createScopedLogger } from '../../util/telemetry';
import { baseHeaders, baseUrl } from '../util/request';
import { ApiResponse, extractProperties } from '../util/transform';

const log = createScopedLogger('diplicity/game/list-options');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = ApiResponse<{
  [key: string]: unknown;
}>;

type TransformedResponse = {
  [key: string]: unknown;
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractProperties(response as DiplicityResponse);
  log.info(`Transformed response: ${JSON.stringify(data)}`);
  return data;
};

const listOptions = async (gameId: string, phaseId: string, userToken) => {
  log.info(`Requesting options for game ${gameId} and phase ${phaseId}`);

  const response = await fetch(
    `${baseUrl}/Game/${gameId}/Phase/${phaseId}/Options`,
    {
      method: 'GET',
      headers: { ...baseHeaders, Authorization: `Bearer ${userToken}` },
    },
  );

  log.info(`Request response: ${response.status}`);

  if (!response.ok) {
    log.info('Request failed. Throwing error.');
    const text = await response.text();
    throw new Error(
      `Request failed with status: ${response.status}, message: ${text}`,
    );
  }

  return transformResponse(await response.json());
};

export { listOptions };
