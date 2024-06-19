import {
  Interaction,
  ChannelType,
  OverwriteResolvable,
  CategoryChannel,
  TextChannel,
  CommandInteraction,
  Role,
  PermissionFlagsBits,
} from 'discord.js';
import * as api from '../diplicity';
import { createScopedLogger } from './telemetry';

const log = createScopedLogger('util/discord');

type UserAuthentication = {
  userToken: string;
};

const tryGetBotToken = async () => {
  try {
    const { token } = await api.login();
    log.info('Bot token acquired');
    return token;
  } catch (error) {
    log.error(`Failed to acquire bot token: ${error.message}`);
    throw error;
  }
};

const tryGetUserToken = async (userId: string, botToken: string) => {
  try {
    const { token } = await api.getUserToken(userId, botToken);
    log.info('User token acquired');
    return token;
  } catch (error) {
    log.error(`Failed to acquire user token: ${error.message}`);
    throw error;
  }
};

const tryGetVariant = async (
  variantName: string,
  authentication: UserAuthentication,
) => {
  log.info(`Trying to get variant with name ${variantName}`);
  const variants = await api.listVariants(authentication.userToken);
  log.info('Variants retrieved');
  const variant = variants.find((variant) => variant.name === variantName);
  if (!variant) {
    log.error(`Variant with name ${variantName} not found`);
    throw new Error(`Variant with name ${variantName} not found`);
  }
  return variant;
};

const createCategory = async (interaction: Interaction, name: string) => {
  try {
    log.info(`Creating category with name ${name}`);
    const category = await interaction.guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
    });
    log.info(`Category created with name ${name}`);
    return category;
  } catch (error) {
    log.error(`Failed to create category: ${error.message}`);
    throw error;
  }
};

const deleteCategory = async (interaction: Interaction, name: string) => {
  try {
    log.info(`Checking if categories exist with name ${name}`);
    const categories = interaction.guild.channels.cache.filter(
      (channel) =>
        channel.name === name && channel.type === ChannelType.GuildCategory,
    );
    if (categories.size > 0) {
      log.info(`Found ${categories.size} categories with name ${name}`);
      categories.forEach(async (category) => {
        log.info(`Deleting all sub-channels in category ${category.name}`);
        interaction.guild.channels.cache
          .filter((channel) => channel.parentId === category.id)
          .forEach(async (channel) => {
            log.info(`Deleting sub-channel ${channel.name}`);
            await channel.delete();
          });
        log.info(`Deleting category ${category.name}`);
        await category.delete();
      });
    }
  } catch (error) {
    log.error(`Failed to delete category: ${error.message}`);
    throw error;
  }
};

type CreateChannelOptions = {
  permissions?: OverwriteResolvable[];
  category?: CategoryChannel;
};

const createChannel = async (
  interaction: Interaction,
  name: string,
  options?: CreateChannelOptions,
) => {
  try {
    log.info(`Creating channel with name ${name}`);
    const channel = await interaction.guild.channels.create({
      name,
      type: ChannelType.GuildText,
      permissionOverwrites: options?.permissions,
      parent: options?.category,
    });
    log.info(`Channel created with name ${name}`);
    return channel;
  } catch (error) {
    log.error(`Failed to create channel: ${error.message}`);
    throw error;
  }
};

const deleteChannel = async (interaction: Interaction, name: string) => {
  try {
    log.info(`Checking if channels exist with name ${name}`);
    const channels = interaction.guild.channels.cache.filter(
      (channel) => channel.name === name,
    );
    if (channels.size > 0) {
      log.info(`Found ${channels.size} channels with name ${name}`);
      channels.forEach(async (channel) => {
        log.info(`Deleting channel ${channel.name}`);
        await channel.delete();
      });
    }
  } catch (error) {
    log.error(`Failed to delete channel: ${error.message}`);
    throw error;
  }
};

const createRole = async (interaction: Interaction, name: string) => {
  try {
    log.info(`Creating role with name ${name}`);
    const role = await interaction.guild.roles.create({
      name,
    });
    log.info(`Role created with name ${name}`);
    return role;
  } catch (error) {
    log.error(`Failed to create role: ${error.message}`);
    throw error;
  }
};

const deleteRole = async (interaction: Interaction, name: string) => {
  try {
    log.info(`Checking if roles exist with name ${name}`);
    const roles = interaction.guild.roles.cache.filter(
      (role) => role.name === name,
    );
    if (roles.size > 0) {
      log.info(`Found ${roles.size} roles with name ${name}`);
      roles.forEach(async (role) => {
        log.info(`Deleting role ${role.name}`);
        await role.delete();
      });
    }
  } catch (error) {
    log.error(`Failed to delete role: ${error.message}`);
    throw error;
  }
};

const createWebhook = async (channel: TextChannel, name: string) => {
  try {
    log.info(`Creating webhook with name ${name}`);
    const webhook = await channel.createWebhook({ name });
    log.info(`Webhook created with name ${name}`);
    return webhook;
  } catch (error) {
    log.error(`Failed to create webhook: ${error.message}`);
    throw error;
  }
};

const withUserAuthentication =
  (
    fn: (
      interaction: CommandInteraction,
      authentication: UserAuthentication,
    ) => Promise<void>,
  ) =>
  async (interaction: CommandInteraction) => {
    const { user } = interaction;
    try {
      const botToken = await tryGetBotToken();
      const userToken = await tryGetUserToken(user.id, botToken);
      await fn(interaction, { userToken });
    } catch (error) {
      await interaction.reply(`An error occurred `);
    }
  };

const withCommandHandler =
  (fn: (interaction: CommandInteraction) => Promise<void>) =>
  async (interaction: CommandInteraction) => {
    log.info(
      `Command invoked: ${interaction.commandName}; user: ${interaction.user.id}; guildId: ${interaction.guildId}`,
    );
    try {
      await fn(interaction);
    } catch (error) {
      await interaction.reply(
        `An error occurred while executing command ${interaction.commandName}: ${error.message}`,
      );
    }
  };

type RequirementFunc = (
  interaction: CommandInteraction,
  authentication: UserAuthentication,
) => Promise<void>;

const ensureStagingGameDoesNotExist: RequirementFunc = async (
  interaction: CommandInteraction,
  authentication: UserAuthentication,
) => {
  const stagingGames = await api.listMyGames(
    'Staging',
    authentication.userToken,
  );
  log.info('Staging games retrieved for user');

  const stagingGameForServer = stagingGames.find(
    (game) => game.name === interaction.guildId,
  );

  if (stagingGameForServer) {
    log.info('There is already a staging game for this server.');
    throw new Error('There is already a staging game for this server.');
  }
};

const ensureStartedGameDoesNotExist: RequirementFunc = async (
  interaction: CommandInteraction,
  authentication: UserAuthentication,
) => {
  const startedGames = await api.listMyGames(
    'Started',
    authentication.userToken,
  );
  log.info('Started games retrieved for user.');

  const startedGameForServer = startedGames.find(
    (game) => game.name === interaction.guildId,
  );

  if (startedGameForServer) {
    log.info('There is already an active game for this server.');
    throw new Error('There is already an active game for this server.');
  }
};

const getGameForServer = async (
  interaction: CommandInteraction,
  authentication: UserAuthentication,
) => {
  const stagingGames = await api.listMyGames(
    'Staging',
    authentication.userToken,
  );
  log.info('Staging games retrieved for user.');
  const activeGames = await api.listMyGames(
    'Started',
    authentication.userToken,
  );
  log.info('Active games retrieved for user.');

  const game = [...stagingGames, ...activeGames].find(
    (game) => game.name === interaction.guildId,
  );

  if (!game) {
    log.info('There is no staging or active game for this server.');
    throw new Error('There is no staging game for this server.');
  }

  return game;
};

const createPermissions = (interaction: Interaction) =>
  ({
    RoleReadWrite: (role: Role): OverwriteResolvable[] => [
      {
        id: interaction.guild.roles.everyone.id,
        deny: PermissionFlagsBits.ViewChannel,
      },
      {
        id: role.id,
        allow: PermissionFlagsBits.ViewChannel,
      },
    ],
    Private: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: PermissionFlagsBits.ViewChannel,
      },
    ] as OverwriteResolvable[],
  }) as const;

const checkRequirements = async (
  requirements: RequirementFunc[],
  interaction: CommandInteraction,
  authentication: UserAuthentication,
) => {
  log.info('Checking requirements');
  await Promise.all(
    requirements.map(async (requirement) => {
      await requirement(interaction, authentication);
    }),
  );
  log.info('All requirements passed');
};

export {
  checkRequirements,
  createCategory,
  createChannel,
  createPermissions,
  createRole,
  createWebhook,
  deleteCategory,
  deleteChannel,
  deleteRole,
  getGameForServer,
  ensureStartedGameDoesNotExist,
  ensureStagingGameDoesNotExist,
  tryGetVariant,
  withCommandHandler,
  withUserAuthentication,
};
