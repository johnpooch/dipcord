import { createScopedLogger } from '../../util/telemetry';
import { baseHeaders, baseUrl } from '../util/request';
import { ListApiResponse, extractPropertiesList } from '../util/transform';

const log = createScopedLogger('diplicity/game/list-variants');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = ListApiResponse<{
  Name: string;
  Description: string;
  CreatedBy: string;
  Start: {
    Year: number;
    Season: string;
  };
}>;

type TransformedResponse = {
  name: string;
  description: string;
  createdBy: string;
  startYear: number;
  startSeason: string;
}[];

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractPropertiesList(response as DiplicityResponse);
  const transformed = data.map(({ Name, Description, CreatedBy, Start }) => ({
    name: Name,
    description: Description,
    createdBy: CreatedBy,
    startYear: Start.Year,
    startSeason: Start.Season,
  }));
  log.info(`Transformed response: ${JSON.stringify(transformed)}`);
  return transformed;
};

const listVariants = async (userToken: string) => {
  log.info(`listVariants invoked`);

  const response = await fetch(`${baseUrl}/Variants`, {
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

export { listVariants };
