import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import { createScopedLogger } from '../../util/telemetry';
import { createDiscordForm } from '../../util/form';
import * as content from './content';
import {
  checkRequirements,
  createCategory,
  createChannel,
  createPermissions,
  createRole,
  createWebhook,
  deleteCategory,
  deleteChannel,
  deleteRole,
  ensureStagingGameDoesNotExist,
  ensureStartedGameDoesNotExist,
  tryGetVariant,
  withCommandHandler,
  withUserAuthentication,
} from '../../util/discord';
import { ComponentType, ButtonStyle } from 'discord.js';

const log = createScopedLogger('commands/game/create-game');

type FormData = {
  variant: string;
  phaseLength: string;
};

const defaultValues: FormData = {
  variant: 'Classical',
  phaseLength: '24',
};

const requirements = [
  ensureStagingGameDoesNotExist,
  ensureStartedGameDoesNotExist,
];

const data = new SlashCommandBuilder()
  .setName('create-game')
  .setDescription('Creates a new game for the current server.');

const execute = withCommandHandler(
  withUserAuthentication(async (interaction, authentication) => {
    const { guildId } = interaction;
    checkRequirements(requirements, interaction, authentication);

    const variants = await api.listVariants(authentication.userToken);
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
        const permissions = createPermissions(interaction);
        await interaction.deferReply({ ephemeral: true });

        const variant = await tryGetVariant(values.variant, authentication);

        await deleteCategory(interaction, 'Orders');
        const category = await createCategory(interaction, 'Orders');

        await deleteChannel(interaction, 'updates');
        // TODO only allow bot to send, edit and delete messages in updates channel
        await createChannel(interaction, 'updates');

        variant.nations.forEach(async (nation) => {
          await deleteRole(interaction, nation);
          const role = await createRole(interaction, nation);

          const permission = permissions.RoleReadWrite(role);
          const options = { permissions: permission, category };
          const channelName = `${nation.toLowerCase()}-orders`;

          await createChannel(interaction, channelName, options);
        });

        await deleteChannel(interaction, 'webhooks');
        const webhooksChannel = await createChannel(interaction, 'webhooks', {
          permissions: permissions.Private,
        });

        const gameStartedWebhook = await createWebhook(
          webhooksChannel,
          'game-started',
        );

        const phaseStartedWebhook = await createWebhook(
          webhooksChannel,
          'phase-started',
        );

        const game = await api.createGame(
          guildId,
          authentication.userToken,
          values.variant,
          Number(values.phaseLength),
          {
            gameStarted: gameStartedWebhook,
            phaseStarted: phaseStartedWebhook,
          },
        );

        const responseContent = content.createGameSuccessResponse
          .replace('{{ variantName }}', game.variant)
          .replace('{{ phaseLength }}', game.phaseLength.toString());

        await interaction.editReply({
          content: responseContent,
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

    await createGameForm.respond(interaction, { ephemeral: true });
  }),
);

export { data, execute };
