import { createScopedLogger } from '../../util/telemetry';
import { DiplicityMember } from '../types';
import { baseHeaders, baseUrl } from '../util/request';
import { extractProperties } from '../util/transform';

const log = createScopedLogger('diplicity/game/add-member');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = {
  Properties: DiplicityMember;
};

type TransformedResponse = {
  id: string;
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractProperties(response as DiplicityResponse);
  const transformed = {
    id: data.User.Id,
  };
  log.info(`Transformed response: ${JSON.stringify(transformed)}`);
  return transformed;
};

const createMemberData = () => ({
  NationPreferences: '',
  GameAlias: '',
});

const addMember = async (gameId: string, memberToken: string) => {
  log.info(`addMember invoked for game: ${gameId}`);

  const data = createMemberData();

  const response = await fetch(`${baseUrl}/Game/${gameId}/Member`, {
    method: 'POST',
    headers: { ...baseHeaders, Authorization: `Bearer ${memberToken}` },
    body: JSON.stringify(data),
  });

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

export { addMember };
