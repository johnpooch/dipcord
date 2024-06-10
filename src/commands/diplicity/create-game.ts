import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import {
  ChannelType,
  Colors,
  CommandInteraction,
  PermissionFlagsBits,
} from 'discord.js';
import { createScopedLogger } from '../../util/telemetry';
import { createDiscordForm } from '../../util/form';
// import { DiscordFormConfig } from '../../util/form';

const commandResponseContent = `
# Create a new Diplicity game

You are about to create a new Diplomacy game in this server. This will authorize the bot to create new roles for each player, and create new channels in a category to manage the game.

You will be able to add new players after the game has been initiated.
`;

const submitResponseContent = `
# Game created

The game has been created successfully. You can now add players to the game by using the \`/add-player\` command.
`;

const log = createScopedLogger('commands/game/create-game');

type FormData = {
  variant: string;
  phaseLength: string;
};

const defaultValues: FormData = {
  variant: 'classical',
  phaseLength: '24',
};

const createGameForm = createDiscordForm<FormData>({
  initialValues: defaultValues,
  interactionContent: commandResponseContent,
  fields: [
    {
      type: 'select',
      name: 'variant',
      placeholder: 'Variant',
      options: [
        { label: 'Classical', value: 'classical' },
        { label: 'Modern', value: 'modern' },
      ],
    },
    {
      type: 'select',
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
    await interaction.update({
      content: `Creating game with variant ${values.variant} and phase length ${values.phaseLength} hours`,
      components: [],
    });

    // TODO create game

    // Create a role in the guild called "England"
    const role = await interaction.guild.roles.create({
      name: 'England',
      color: Colors.Red,
    });

    // Create a channel in the guild called "England - Orders" with the category "Orders"
    const category = await interaction.guild.channels.create({
      name: 'Orders',
      type: ChannelType.GuildCategory,
    });

    await interaction.guild.channels.create({
      name: 'england-orders',
      type: ChannelType.GuildText,
      parent: category.id,
      // channel should be hidden from everyone that doesn't have the "england" role
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

    await interaction.editReply({
      content: submitResponseContent,
    });
  },
});

const data = new SlashCommandBuilder()
  .setName('create-game')
  .setDescription('Creates a new game for the current server.');

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const { user, channelId } = interaction;

  log.info(
    `Command invoked: ${interaction.commandName}; user: ${user.id}; channelId: ${channelId}`,
  );

  try {
    const { token: botToken } = await api.login();
    log.info('Bot token acquired');

    const { token: userToken } = await api.getUserToken(user.id, botToken);
    log.info('User token acquired');

    const stagingGames = await api.listGames('Staging', userToken);
    log.info('Staging games retrieved for user');

    const stagingGameForServer = stagingGames.find(
      (game) => game.name === channelId,
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

    const startedGames = await api.listGames('Started', userToken);
    log.info('Started games retrieved for user.');

    const startedGameForServer = startedGames.find(
      (game) => game.name === channelId,
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

    log.info('Responding to user with create game form');
    await createGameForm.respond(interaction, { ephemeral: true });
  } catch (error) {
    // Respond to the user with the error message
    await interaction.reply(
      `An error occurred while creating the game: ${error.message}`,
    );
  }
};

export { data, execute };
