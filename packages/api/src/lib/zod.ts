import type { ZodError } from 'zod'
import type { ErrorMessageOptions } from 'zod-error'
import { generateErrorMessage } from 'zod-error'

const zodErrorOptions: ErrorMessageOptions = {
  transform: ({ errorMessage, index }) => `Error #${index + 1}: ${errorMessage}`,
}

export const generateZodErrorMessage = (error: ZodError): string => {
  return generateErrorMessage(error.issues, zodErrorOptions)
}
