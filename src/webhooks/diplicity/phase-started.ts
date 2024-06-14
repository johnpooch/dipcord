import { Message, Webhook, WebhookType } from 'discord.js';

import * as api from '../../diplicity';
import { createScopedLogger } from '../../util';

const log = createScopedLogger('webhooks/diplicity/phase-started');

const content = `
## New phase: {{ phaseDisplay }}

The deadline for this phase is {{ time }} (GMT) on {{ date }} ({{ timezone }}).
`;

export const name = 'phase-started';
export const execute = async (
  message: Message<boolean>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _webhook: Webhook<WebhookType>,
) => {
  log.info('Phase started webhook handler invoked');

  const { guildId } = message;

  const { token: botToken } = await api.login();

  log.info(`Fetching games`);
  const games = await api.listGames('Started', botToken);
  if (games.length === 0) {
    log.info('No active games found');
    message.reply('No active games found');
    return;
  }

  log.info(`Looking for game with guild id`);
  const game = games.find((game) => game.name === guildId);
  if (!game) {
    log.info(`Game with guild id ${guildId} not found`);
    message.reply(`Game with guild id ${guildId} not found`);
    return;
  }
  log.info(`Game found: ${JSON.stringify(game)}`);

  log.info(`Fetching channels`);
  const channels = await message.guild.channels.fetch();
  log.info(`Channels found: ${JSON.stringify(channels)}`);

  log.info(`Finding "updates" channel`);
  const channel = channels.find((channel) => channel.name === `updates`);

  if (!channel.isTextBased()) {
    log.error(`Channel ${channel.name} is not a text channel`);
    return;
  }

  // Example deadline 2024-06-15T11:24:51.58316Z
  const formattedTime = new Date(game.newestPhase.deadline).toLocaleTimeString(
    'en-GB',
    {
      hour: '2-digit',
      minute: '2-digit',
    },
  );

  const formattedDate = new Date(game.newestPhase.deadline).toLocaleDateString(
    'en-GB',
  );

  const formattedTimezone = new Date(
    game.newestPhase.deadline,
  ).toLocaleTimeString('en-GB', {
    timeZoneName: 'short',
  });

  await channel.send(
    content
      .replace(
        /{{ phaseDisplay }}/g,
        `${game.newestPhase.season} ${game.newestPhase.year} ${game.newestPhase.type}`,
      )
      .replace(/{{ time }}/g, formattedTime)
      .replace(/{{ date }}/g, formattedDate)
      .replace(/{{ timezone }}/g, formattedTimezone),
  );
};
