import { Message, Webhook, WebhookType } from 'discord.js';

import * as api from '../../diplicity';
import { createScopedLogger } from '../../util';

const log = createScopedLogger('webhooks/diplicity/game-started');

const content = `
## Game started

You have been assigned **{{ nation }}**. You have been assigned a private channel called **{{ nation-lowercase }}-orders**. In this channel, you can use the **/add-order** command to add orders to your units. You can also use the **/help** command to see all available commands.

You can chat with the other players using direct (group) messages. The other players are:
{{ players }}
`;

const playerContent = `- **{{ nation }}**: {{ username }}`;

export const name = 'game-started';
export const execute = async (
  message: Message<boolean>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _webhook: Webhook<WebhookType>,
) => {
  log.info('Game started webhook handler invoked');

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

  log.info(`Fetching members`);
  const discordMembers = await message.guild.members.fetch();
  log.info(`Members found: ${JSON.stringify(discordMembers)}`);

  log.info(`Fetching channels`);
  const channels = await message.guild.channels.fetch();
  log.info(`Channels found: ${JSON.stringify(channels)}`);

  // Iterate over members in game and send message to each <nation>-orders channel
  for (const member of game.members) {
    const userId = member.user.id;
    log.info(`Fetching member ${userId}`);

    // const discordMember = discordMembers.get(userId);

    // TODO assign roles

    const nation = member.nation;
    const nationLowercase = nation.toLowerCase();
    log.info(`Nation: ${nation}, lowercase: ${nationLowercase}`);

    const players = game.members
      .map((member) => {
        const { nation } = member;
        const discordMember = discordMembers.get(member.user.id);
        return playerContent
          .replace('{{ nation }}', nation)
          .replace('{{ username }}', discordMember.displayName);
      })
      .join('\n');

    log.info(`Players text: ${players}`);

    const messageContent = content
      .replace('{{ nation }}', nation)
      .replace('{{ nation-lowercase }}', nationLowercase)
      .replace('{{ players }}', players);

    log.info(`Message content: ${messageContent}`);

    log.info(`Sending message to ${nationLowercase}-orders channel`);
    const channel = channels.find(
      (channel) => channel.name === `${nationLowercase}-orders`,
    );
    if (!channel) {
      log.error(`Channel ${nationLowercase}-orders not found`);
      continue;
    }

    if (!channel.isTextBased()) {
      log.error(`Channel ${nationLowercase}-orders is not a text channel`);
      continue;
    }
    await channel.send(messageContent);
  }
};
