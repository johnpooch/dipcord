import { SlashCommandBuilder } from '@discordjs/builders';

import * as api from '../../diplicity';
import { createScopedLogger } from '../../util/telemetry';
import {
  getGameForServer,
  withCommandHandler,
  withUserAuthentication,
} from '../../util/discord';
import { createDiscordForm } from '../../util/form';

const log = createScopedLogger('commands/game/create-order');

type FormData = {
  unit: string;
  type: string;
  destination: string;
  auxUnit: string;
  auxDestination: string;
};

const orderReadyToSubmit = (values: Partial<FormData>) => {
  if (!values.unit || !values.type) {
    return false;
  }
  if (values.type === 'move' && !values.destination) {
    return false;
  }
  if (['convoy', 'support'].includes(values.type) && !values.auxUnit) {
    return false;
  }
  if (['convoy', 'support'].includes(values.type) && !values.auxDestination) {
    return false;
  }
  return true;
};

const data = new SlashCommandBuilder()
  .setName('create-order')
  .setDescription('Creates a new order for the current phase.');

const execute = withCommandHandler(
  withUserAuthentication(async (interaction, authentication) => {
    const game = await getGameForServer(interaction, authentication);
    const phaseId = game.newestPhase.id;
    const options = await api.listOptions(
      game.id,
      phaseId,
      authentication.userToken,
    );
    log.info(
      `Options for game ${game.id} and phase ${phaseId}: ${JSON.stringify(options)}`,
    );
    const form = createDiscordForm<FormData>({
      interactionContent: 'Please provide the details for the order',
      submitLabel: 'Create order',
      fields: [
        {
          type: 'string-select',
          name: 'unit',
          placeholder: 'Unit',
          options: () => {
            return Object.keys(options).map((key) => ({
              label: key,
              value: key,
            }));
          },
        },
        {
          type: 'string-select',
          name: 'type',
          placeholder: 'Order type',
          options: (values) => {
            if (!values.unit) {
              return [{ label: 'dummy', value: 'dummy' }];
            }
            return Object.keys(options[values.unit]['Next']).map((key) => ({
              label: key,
              value: key,
            }));
          },
          disabled: (values) => !values.unit,
        },
        {
          type: 'string-select',
          name: 'destination',
          placeholder: 'Destination',
          options: (values) => {
            if (!values.unit || !values.type) {
              return [{ label: 'dummy', value: 'dummy' }];
            }
            return Object.keys(
              options[values.unit]['Next'][values.type]['Next'][values.unit][
                'Next'
              ],
            ).map((key) => ({
              label: key,
              value: key,
            }));
          },
          hidden: (values) => values.type !== 'Move',
        },
        {
          type: 'string-select',
          name: 'auxUnit',
          placeholder: (values) =>
            `Unit to be ${values.type === 'Convoy' ? 'convoyed' : 'supported'}`,
          options: [
            { label: 'Army Berlin', value: 'berlin' },
            { label: 'Fleet Kiel', value: 'kiel' },
            { label: 'Army Munich', value: 'munich' },
          ],
          hidden: (values) => !['Convoy', 'Support'].includes(values.type),
        },
        {
          type: 'string-select',
          name: 'auxDestination',
          placeholder: 'Destination',
          options: [
            { label: 'Berlin', value: 'berlin' },
            { label: 'Kiel', value: 'kiel' },
            { label: 'Munich', value: 'munich' },
          ],
          hidden: (values) => !['Convoy', 'Support'].includes(values.type),
          disabled: (values) => !values.auxUnit,
        },
      ],
      submitDisabled: (values) => !orderReadyToSubmit(values),
      onSubmit: async (interaction, values) => {
        interaction.reply(`Order created: ${JSON.stringify(values)}`);
      },
    });
    await form.respond(interaction, { ephemeral: true });
  }),
);

export { data, execute };
