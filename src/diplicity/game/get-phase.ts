import { createScopedLogger } from '../../util';
import { baseHeaders, baseUrl } from '../util/request';

const log = createScopedLogger('diplicity/game/get-phase');

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = {
  Properties: {
    Units: {
      Unit: {
        Type: string;
        Nation: string;
      };
      Province: string;
    }[];
    SCs: {
      Province: string;
    }[];
  };
};

type TransformedResponse = {
  units: {
    [key: string]: {
      type: string;
      nation: string;
    };
  };
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  const { Properties } = response as DiplicityResponse;
  log.info(`Transforming response: ${JSON.stringify(Properties)}`);
  const transformed = {
    units: Properties.Units.reduce((acc, { Unit, Province }) => {
      acc[Province] = {
        type: Unit.Type,
        nation: Unit.Nation,
      };
      return acc;
    }, {}),
  };
  log.info(`Transformed response: ${JSON.stringify(transformed)}`);
  return transformed;
};

const getPhase = async (gameId: string, phaseId: string, userToken: string) => {
  const response = await fetch(`${baseUrl}/Game/${gameId}/Phase/${phaseId}`, {
    method: 'GET',
    headers: { ...baseHeaders, Authorization: `Bearer ${userToken}` },
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! Message: ${response.text}; Status: ${response.status}`,
    );
  }

  return transformResponse(await response.json());
};

export { getPhase };
