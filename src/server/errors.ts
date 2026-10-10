export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export const ERROR_TEXT: Record<string, string> = {
  email: "Enter a valid email.",
  email_taken: "An account with that email already exists.",
  password: "Use a password of at least 12 characters.",
  name: "Enter a name up to 120 characters.",
  auth: "Email or password is incorrect.",
  npi: "Enter a 10-digit NPI.",
  tax: "Enter a 9-digit tax ID.",
  timezone: "Choose a time zone.",
  rate: "Too many attempts. Wait a minute and try again.",
  amount: "Enter a dollar amount.",
  time: "Choose a start time.",
  service: "Enter a service code.",
  body: "Fill every section before signing.",
  immutable: "Signed notes cannot be edited.",
  consent: "The consent box has to be checked.",
  baa: "Accept the agreement before continuing.",
  signature: "Type your name to sign.",
  reason: "Tell your clinician what brings you in.",
  emergency: "Add an emergency contact.",
  phone: "Add a phone number for that contact.",
  expired: "This link has expired. Ask your clinician for a new one.",
  message: "Write a message first.",
  stripe: "Card payments need a Stripe account connected in settings.",
  reminders: "Choose at least one reminder time.",
  not_found: "That record was not found.",
  identity: "Add your NPI and tax ID before generating a superbill.",
  method: "Record cash or a transfer.",
  date: "Enter the date you received the payment.",
};
