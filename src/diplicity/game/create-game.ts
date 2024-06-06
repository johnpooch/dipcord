import { baseHeaders, baseUrl } from '../util/request';

type TransformResponse<T> = (response: unknown) => T;

type DiplicityResponse = {
  Properties: {
    Desc: string;
    Variant: string;
    ID: string;
  };
};

type TransformedResponse = {
  id: string;
  name: string;
  variant: string;
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  const { Properties } = response as DiplicityResponse;
  return {
    id: Properties.ID,
    variant: Properties.Variant,
    name: Properties.Desc,
  };
};

const createGameData = (channelId: string) => ({
  Id: channelId,
  Desc: channelId,
  Variant: 'Classical',
  PhaseLengthMinutes: 60 * 24,
  NonMovementPhaseLengthMinutes: 60 * 24,
  MaxHated: 0,
  MaxHater: 0,
  MinRating: 0,
  MaxRating: 0,
  MinReliability: 0,
  MinQuickness: 0,
  Private: true,
  NoMerge: false,
  DisableConferenceChat: true,
  DisableGroupChat: true,
  DisablePrivateChat: true,
  NationAllocation: 0,
  Anonymous: false,
  LastYear: 0,
  SkipMuster: false,
  ChatLanguageISO639_1: 'en',
  GameMasterEnabled: false,
});

const createGame = async (channelId, userToken) => {
  const data = createGameData(channelId);
  const response = await fetch(`${baseUrl}/Game`, {
    method: 'POST',
    headers: { ...baseHeaders, Authorization: `Bearer ${userToken}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `HTTP error! Message: ${response.text}; Status: ${response.status}`,
    );
  }

  return transformResponse(await response.json());
};

export { createGame };
