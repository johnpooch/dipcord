import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import {
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  ComponentType,
  PermissionFlagsBits,
} from 'discord.js';
import { createScopedLogger } from '../../util/telemetry';
import { createDiscordForm } from '../../util/form';
import * as content from './content';

const log = createScopedLogger('commands/game/create-game');

type FormData = {
  variant: string;
  phaseLength: string;
};

const defaultValues: FormData = {
  variant: 'Classical',
  phaseLength: '24',
};

const data = new SlashCommandBuilder()
  .setName('create-game')
  .setDescription('Creates a new game for the current server.');

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const { user, guildId } = interaction;

  log.info(
    `Command invoked: ${interaction.commandName}; user: ${user.id}; guildId: ${guildId}`,
  );

  try {
    const { token: botToken } = await api.login();
    log.info('Bot token acquired');

    const { token: userToken } = await api.getUserToken(user.id, botToken);
    log.info('User token acquired');

    const stagingGames = await api.listMyGames('Staging', userToken);
    log.info('Staging games retrieved for user');

    const stagingGameForServer = stagingGames.find(
      (game) => game.name === guildId,
    );

    if (stagingGameForServer) {
      log.info(
        'There is already a staging game for this server. Responding to user.',
      );
      await interaction.reply(
        'Cannot create a new game. There is already a staging game for this server.',
      );
      return;
    }

    const startedGames = await api.listMyGames('Started', userToken);
    log.info('Started games retrieved for user.');

    const startedGameForServer = startedGames.find(
      (game) => game.name === guildId,
    );

    if (startedGameForServer) {
      log.info(
        'There is already an active game for this server. Responding to user.',
      );
      await interaction.reply(
        'Cannot create a new game. There is already an active game for this server.',
      );
      return;
    }

    const variants = await api.listVariants(userToken);
    log.info('Variants retrieved');

    const createGameForm = createDiscordForm<FormData>({
      initialValues: defaultValues,
      interactionContent: content.createGameCommandResponse,
      submitLabel: 'Create game',
      fields: [
        {
          type: 'string-select',
          name: 'variant',
          placeholder: 'Variant',
          options: variants.map((variant) => ({
            label: variant.name,
            value: variant.name,
          })),
        },
        {
          type: 'string-select',
          name: 'phaseLength',
          placeholder: 'Phase length',
          options: [
            { label: '48 hours', value: '48' },
            { label: '24 hours', value: '24' },
            { label: '12 hours', value: '12' },
          ],
        },
      ],
      onSubmit: async (interaction, values) => {
        await interaction.deferReply({ ephemeral: true });

        const variant = variants.find((v) => v.name === values.variant);
        if (!variant) {
          await interaction.reply(
            `Cannot create game with variant ${values.variant}. Variant not found.`,
          );
        }

        // Check if orders category exists - delete if it does
        const existingOrdersCategories =
          interaction.guild.channels.cache.filter(
            (channel) =>
              channel.name === 'Orders' &&
              channel.type === ChannelType.GuildCategory,
          );

        await Promise.all(
          existingOrdersCategories.map(async (category) => {
            interaction.guild.channels.cache
              .filter((channel) => channel.parentId === category.id)
              .forEach(async (channel) => {
                log.info(`Deleting existing orders channel ${channel.name}`);
                await channel.delete();
                log.info(`Orders channel deleted ${channel.name}`);
              });

            log.info('Deleting existing orders category');
            await category.delete();
            log.info('Orders category deleted');
          }),
        );

        const orderCategory = await interaction.guild.channels.create({
          name: 'Orders',
          type: ChannelType.GuildCategory,
        });
        log.info('Orders category created');

        log.info('Iterating over variant nations');
        variant.nations.forEach(async (nation) => {
          // Check if any roles exist for the nation - delete if they do
          const existingRoles = interaction.guild.roles.cache.filter(
            (role) => role.name === nation,
          );

          await Promise.all(
            existingRoles.map(async (role) => {
              log.info(`Deleting existing role for nation ${nation}`);
              await role.delete();
              log.info(`Role deleted for nation ${nation}`);
            }),
          );

          const role = await interaction.guild.roles.create({
            name: nation,
          });
          log.info(`Role created for nation ${nation}`);

          await interaction.guild.channels.create({
            name: `${nation.toLowerCase()}-orders`,
            type: ChannelType.GuildText,
            parent: orderCategory.id,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone.id,
                deny: PermissionFlagsBits.ViewChannel,
              },
              {
                id: role.id,
                allow: PermissionFlagsBits.ViewChannel,
              },
            ],
          });
          log.info(`Orders channel created for nation ${nation}`);
        });

        log.info('Deleting all existing webhooks channels for server');
        const existingWebhooksChannels =
          interaction.guild.channels.cache.filter(
            (channel) => channel.name === 'webhooks',
          );

        await Promise.all(
          existingWebhooksChannels.map(async (channel) => {
            log.info('Deleting existing webhooks channel for server');
            await channel.delete();
            log.info('Webhooks channel deleted for server');
          }),
        );

        log.info('Creating private webhooks channel for server');
        const webhooksChannel = await interaction.guild.channels.create({
          name: 'webhooks',
          type: ChannelType.GuildText,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: PermissionFlagsBits.ViewChannel,
            },
          ],
        });
        log.info('Private webhooks channel created for server');

        // Ensure that there is no existing webhook for server with name "game-started"
        log.info('Retrieving webhooks for server');
        const existingWebhooks = await interaction.guild.fetchWebhooks();
        log.info('Webhooks retrieved');

        // Delete all existing webhooks
        await Promise.all(
          existingWebhooks.map(async (webhook) => {
            log.info(`Deleting webhook ${webhook.name}`);
            await webhook.delete();
            log.info(`Webhook deleted ${webhook.name}`);
          }),
        );

        log.info('Creating game-started webhook for webhooks channel');
        const gameStartedWebhook = await webhooksChannel.createWebhook({
          name: 'game-started',
        });
        log.info('Game-started webhook created for webhooks channel');

        log.info('Creating phase-started webhook for webhooks channel');
        const phaseStartedWebhook = await webhooksChannel.createWebhook({
          name: 'phase-started',
        });
        log.info('Phase-started webhook created for webhooks channel');

        log.info('Creating game');
        await api.createGame(
          guildId,
          userToken,
          values.variant,
          Number(values.phaseLength),
          {
            gameStarted: {
              id: gameStartedWebhook.id,
              token: gameStartedWebhook.token,
            },
            phaseStarted: {
              id: phaseStartedWebhook.id,
              token: phaseStartedWebhook.token,
            },
          },
        );
        log.info('Game created');

        log.info('Responding to user with game created message');
        await interaction.editReply({
          content: content.createGameSuccessResponse
            .replace('{{ variantName }}', values.variant)
            .replace('{{ phaseLength }}', values.phaseLength),
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  label: 'Add players',
                  style: ButtonStyle.Primary,
                  customId: 'add-player',
                },
              ],
            },
          ],
        });
      },
    });

    log.info('Responding to user with create game form');
    await createGameForm.respond(interaction, { ephemeral: true });
  } catch (error) {
    await interaction.reply(
      `An error occurred while creating the game: ${error.message}`,
    );
  }
};

export { data, execute };
