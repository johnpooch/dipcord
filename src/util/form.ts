import {
  BaseMessageOptions,
  ButtonStyle,
  CacheType,
  CommandInteraction,
  ComponentType,
  InteractionReplyOptions,
  InteractionResponse,
  StringSelectMenuComponentData,
} from 'discord.js';

type ResponseInteraction = Awaited<
  ReturnType<InteractionResponse['awaitMessageComponent']>
>;

type DiscordFormField = {
  type: 'select';
  name: string;
  placeholder: string;
  options?: { label: string; value: string }[];
};

type DiscordFormConfig<TFormValues> = {
  initialValues: TFormValues;
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
  const render = (values: TFormValues): BaseMessageOptions => {
    console.log('Values: ', values);
    return {
      content: config.interactionContent,
      components: [
        ...config.fields.map((field) => {
          return {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.StringSelect,
                placeholder: field.placeholder,
                customId: field.name,
                options: field.options.map((option) => {
                  return {
                    ...option,
                    value: JSON.stringify({
                      ...values,
                      [field.name]: option.value,
                    }),
                    default: values[field.name] === option.value,
                  };
                }),
              } as StringSelectMenuComponentData,
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
      interaction: CommandInteraction<CacheType>,
      options?: InteractionReplyOptions,
    ) => {
      const commandResponse = await interaction.reply({
        ...render(config.initialValues),
        ...options,
      });

      const handleResponse = async (
        response: InteractionResponse,
      ): Promise<void> => {
        try {
          const responseInteraction = await response.awaitMessageComponent({
            time: 60_000,
          });
          if (responseInteraction.isStringSelectMenu()) {
            const onChangeValues = JSON.parse(responseInteraction.values[0]);
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
          console.error(error);
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
