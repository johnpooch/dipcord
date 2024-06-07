import { createScopedLogger } from '../../util/telemetry';
import { DiplicityMember, Member } from '../types';
import { baseHeaders, baseUrl } from '../util/request';
import { ListApiResponse, extractPropertiesList } from '../util/transform';

const log = createScopedLogger('diplicity/game/list-games');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = ListApiResponse<{
  ID: string;
  Desc: string;
  Variant: string;
  Members: DiplicityMember[];
}>;

type TransformedResponse = {
  id: string;
  name: string;
  members: Member[];
  variant: string;
}[];

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractPropertiesList(response as DiplicityResponse);
  const transformed = data.map(({ ID, Desc, Variant, Members }) => ({
    id: ID,
    name: Desc,
    variant: Variant,
    members: Members.map(({ User }) => ({
      user: {
        id: User.Id,
      },
    })),
  }));
  log.info(`Transformed response: ${JSON.stringify(transformed)}`);
  return transformed;
};

const listGames = async (status: string, userToken: string) => {
  log.info(`listGames invoked with status: ${status}`);

  const response = await fetch(`${baseUrl}/Games/My/${status}`, {
    method: 'GET',
    headers: { ...baseHeaders, Authorization: `Bearer ${userToken}` },
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

export { listGames };
