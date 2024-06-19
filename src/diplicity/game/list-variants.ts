import { createScopedLogger } from '../../util/telemetry';
import { baseHeaders, baseUrl } from '../util/request';
import { ListApiResponse, extractPropertiesList } from '../util/transform';

const log = createScopedLogger('diplicity/game/list-variants');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = ListApiResponse<{
  Name: string;
  Description: string;
  CreatedBy: string;
  Nations: string[];
  ProvinceLongNames: { [key: string]: string };
  Start: {
    Year: number;
    Season: string;
    SCs: { [key: string]: string };
  };
}>;

type TransformedResponse = {
  name: string;
  description: string;
  createdBy: string;
  nations: string[];
  provinceLongNames: { [key: string]: string };
  startYear: number;
  startSeason: string;
  supplyCenters: Set<string>;
}[];

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  log.info(`Transforming response: ${JSON.stringify(response)}`);
  const data = extractPropertiesList(response as DiplicityResponse);
  const transformed = data.map((variant) => ({
    name: variant.Name,
    description: variant.Description,
    createdBy: variant.CreatedBy,
    nations: variant.Nations,
    provinceLongNames: variant.ProvinceLongNames,
    supplyCenters: new Set(Object.keys(variant.Start.SCs)),
    startYear: variant.Start.Year,
    startSeason: variant.Start.Season,
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
