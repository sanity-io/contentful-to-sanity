import {requiredString} from 'helpers/validators'
import inquirer, {InputQuestion} from 'inquirer'

type Answers = {
  value: string
}

export async function promptSingleInput(
  options: Omit<InputQuestion<Answers>, 'type'> = {},
): Promise<string> {
  const defaults: InputQuestion<Answers> = {
    type: 'input',
    validate: requiredString,
    filter: (value) => `${value}`.trim(),
  }

  const answers = await inquirer.prompt<Answers>([
    {
      ...defaults,
      ...options,
      name: 'value',
    },
  ])

  return answers.value
}
