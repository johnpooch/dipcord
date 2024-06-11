import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import { CommandInteraction } from 'discord.js';
import { createScopedLogger } from '../../util/telemetry';

const listVariantsSuccessResponse = (
  variants: Awaited<ReturnType<typeof api.listVariants>>,
): string => {
  // Truncate variant description after 100 characters
  const truncate = (description: string): string =>
    description.length > 100
      ? `${description.substring(0, 100)}...`
      : description;
  return `# Variants\n${variants.map((variant) => `## ${variant.name}\n${truncate(variant.description)}\n**Created by:** ${variant.createdBy}\n**Starts:** ${variant.startSeason} ${variant.startYear}`).join('\n')}`;
};

const log = createScopedLogger('commands/game/add-member');

const data = new SlashCommandBuilder()
  .setName('list-variants')
  .setDescription('Lists the available game variants for Dipcord games');

const execute = async (interaction: CommandInteraction): Promise<void> => {
  log.info('Command invoked');

  const { user, channelId } = interaction;
  log.info(`user: ${user.id}, channelId: ${channelId}`);

  try {
    const { token: botToken } = await api.login();
    log.info('Bot token acquired');

    const { token: userToken } = await api.getUserToken(user.id, botToken);
    log.info('User token acquired');

    const variants = await api.listVariants(userToken);
    log.info(`Variants retrieved`);

    await interaction.reply(listVariantsSuccessResponse(variants));
  } catch (error) {
    log.error(`An error occurred: ${error.message}`);
    await interaction.reply(`Could not list variants: ${error.message}`);
  }
};

export { data, execute };
