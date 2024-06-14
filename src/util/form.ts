import {
  BaseMessageOptions,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  InteractionReplyOptions,
  InteractionResponse,
  StringSelectMenuComponentData,
  UserSelectMenuComponentData,
  ButtonInteraction,
  AnySelectMenuInteraction,
  Message,
} from 'discord.js';
import { createScopedLogger } from './telemetry';

const log = createScopedLogger('util/form');

type ResponseInteraction = Awaited<
  ReturnType<InteractionResponse['awaitMessageComponent']>
>;

type DiscordFormField = {
  type: 'string-select' | 'user-select';
  name: string;
  placeholder: string;
  options?: { label: string; value: string }[];
};

type DiscordFormConfig<TFormValues> = {
  initialValues?: TFormValues;
  interactionContent?: BaseMessageOptions['content'];
  fields: DiscordFormField[];
  onSubmit: (
    interaction: ResponseInteraction,
    values: TFormValues,
  ) => Promise<void>;
  onCancel?: (interaction: ResponseInteraction) => void;
  timeout?: number;
  submitLabel?: string;
};

const createDiscordForm = <TFormValues>(
  config: DiscordFormConfig<TFormValues>,
) => {
  const render = (values: Partial<TFormValues>): BaseMessageOptions => {
    return {
      content: config.interactionContent,
      components: [
        ...config.fields.map((field) => {
          return {
            type: ComponentType.ActionRow,
            components: [
              field.type === 'string-select'
                ? ({
                    type: ComponentType.StringSelect,
                    placeholder: field.placeholder,
                    customId: field.name,
                    options: field.options.map((option) => {
                      log.info(`Creating option: ${JSON.stringify(option)}`);
                      return {
                        ...option,
                        value: JSON.stringify({
                          ...values,
                          [field.name]: option.value,
                        }),
                        default: values[field.name] === option.value,
                      };
                    }),
                  } as StringSelectMenuComponentData)
                : ({
                    type: ComponentType.UserSelect,
                    placeholder: field.placeholder,
                    customId: field.name,
                  } as UserSelectMenuComponentData),
            ],
          };
        }),
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              label: 'Cancel',
              style: ButtonStyle.Danger,
              customId: 'cancel',
            },
            {
              type: ComponentType.Button,
              label: config.submitLabel ?? 'Submit',
              style: ButtonStyle.Primary,
              customId: `submit-${JSON.stringify(values)}`,
            },
          ],
        },
      ],
    };
  };

  return {
    respond: async (
      interaction:
        | CommandInteraction<CacheType>
        | ButtonInteraction<CacheType>
        | AnySelectMenuInteraction<CacheType>,
      options?: InteractionReplyOptions,
    ) => {
      const commandResponse = await interaction.reply({
        ...render(config.initialValues ?? {}),
        ...options,
        fetchReply: true,
      });

      const handleResponse = async (
        response: InteractionResponse | Message<boolean>,
      ): Promise<void> => {
        try {
          const responseInteraction = await response.awaitMessageComponent({
            time: 60_000,
          });
          log.info(`Handling response: ${responseInteraction.customId}`);
          if (responseInteraction.isStringSelectMenu()) {
            const onChangeValues = JSON.parse(responseInteraction.values[0]);
            log.info(`Values: ${JSON.stringify(onChangeValues)}`);
            const nextResponse = await responseInteraction.update(
              render(onChangeValues),
            );
            await handleResponse(nextResponse);
          } else if (responseInteraction.customId.startsWith('submit')) {
            const onSubmitValues = JSON.parse(
              responseInteraction.customId.replace('submit-', ''),
            );
            await config.onSubmit(responseInteraction, onSubmitValues);
          } else if (responseInteraction.customId === 'cancel') {
            await responseInteraction.update({
              content: 'Action cancelled',
              components: [],
            });
          }
        } catch (error) {
          await interaction.editReply({
            content: 'Confirmation not received within 1 minute, cancelling',
            components: [],
          });
        }
      };

      await handleResponse(commandResponse);
    },
  };
};

export { DiscordFormConfig, createDiscordForm };
