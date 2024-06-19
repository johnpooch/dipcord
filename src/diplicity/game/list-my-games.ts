import { createScopedLogger } from '../../util/telemetry';
import { DiplicityMember, Member } from '../types';
import { baseHeaders, baseUrl } from '../util/request';
import { ListApiResponse, extractPropertiesList } from '../util/transform';

const log = createScopedLogger('diplicity/game/list-my-games');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = ListApiResponse<{
  ID: string;
  Desc: string;
  Variant: string;
  Members: DiplicityMember[];
  NewestPhaseMeta: {
    PhaseOrdinal: number;
    Season: string;
    Year: number;
    Type: string;
    Resolved: boolean;
    CreatedAt: string;
    CreatedAgo: number;
    ResolvedAt: string;
    ResolvedAgo: number;
    DeadlineAt: string;
    NextDeadlineIn: number;
  }[];
}>;

type TransformedResponse = {
  id: string;
  name: string;
  members: Member[];
  variant: string;
  newestPhase: {
    id: string;
    season: string;
    year: number;
    type: string;
    deadline: string;
  };
}[];

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractPropertiesList(response as DiplicityResponse);
  const transformed = data.map((game) => ({
    id: game.ID,
    name: game.Desc,
    variant: game.Variant,
    members: game.Members.map(({ User, Nation }) => ({
      nation: Nation,
      user: {
        id: User.Id,
      },
    })),
    newestPhase: game.NewestPhaseMeta &&
      game.NewestPhaseMeta.length > 0 && {
        id: game.NewestPhaseMeta[0].PhaseOrdinal.toString(),
        season: game.NewestPhaseMeta[0].Season,
        year: game.NewestPhaseMeta[0].Year,
        type: game.NewestPhaseMeta[0].Type,
        deadline: game.NewestPhaseMeta[0].DeadlineAt,
      },
  }));
  log.info(`Transformed response: ${JSON.stringify(transformed)}`);
  return transformed;
};

const listMyGames = async (status: string, userToken: string) => {
  log.info(`listMyGames invoked with status: ${status}`);

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

export { listMyGames };
