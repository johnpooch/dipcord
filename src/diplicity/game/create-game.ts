import { createScopedLogger } from '../../util';
import { baseHeaders, baseUrl } from '../util/request';

const log = createScopedLogger('diplicity/game/create-game');

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

type CreateGameWehbooks = {
  gameStarted: {
    token: string;
    id: string;
  };
  phaseStarted: {
    token: string;
    id: string;
  };
};

const transformResponse: TransformResponse<TransformedResponse> = (
  response,
) => {
  const { Properties } = response as DiplicityResponse;
  log.info(`Transforming response: ${JSON.stringify(Properties)}`);
  return {
    id: Properties.ID,
    variant: Properties.Variant,
    name: Properties.Desc,
  };
};

const createGameData = (
  channelId: string,
  variant: string,
  phaseLength: number,
  webhooks: CreateGameWehbooks,
) => ({
  Id: channelId,
  Desc: channelId,
  Variant: variant,
  PhaseLengthMinutes: 60 * phaseLength,
  NonMovementPhaseLengthMinutes: 60 * phaseLength,
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
  GameStartedDiscordWebhookId: webhooks.gameStarted.id,
  GameStartedDiscordWebhookToken: webhooks.gameStarted.token,
  PhaseStartedDiscordWebhookId: webhooks.phaseStarted.id,
  PhaseStartedDiscordWebhookToken: webhooks.phaseStarted.token,
});

const createGame = async (
  channelId,
  userToken,
  variant: string,
  phaseLength: number,
  webhooks: CreateGameWehbooks,
) => {
  const data = createGameData(channelId, variant, phaseLength, webhooks);
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
