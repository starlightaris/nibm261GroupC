export type ProfileDetailsInput = {
  name: string;
  phone: string;
};

export type ProfileField = keyof ProfileDetailsInput;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const NAME_MAX_LENGTH = 80;
const NAME_RULE = 'letters A-Z only, with single spaces between words';

export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

// Names are kept in Firestore with underscores in place of spaces ("De Silva" -> "De_Silva").
export function toStoredName(value: string): string {
  return normalizeName(value).replace(/ /g, '_');
}

export function fromStoredName(value: string): string {
  return value.replace(/_/g, ' ');
}

export function isValidPhone(value: string): boolean {
  return /^[0-9]{10}$/.test(value);
}

function nameError(label: string, value: string): string | undefined {
  const name = normalizeName(value);
  if (!name) return `${label} is required.`;
  if (name.length > NAME_MAX_LENGTH) return `${label} must be ${NAME_MAX_LENGTH} characters or fewer.`;
  if (!NAME_PATTERN.test(name)) return `${label} must use ${NAME_RULE}.`;
  return undefined;
}

export function validateFullName(value: string): string | undefined {
  return nameError('Name', value);
}

// Splits a full name into first word + the rest, both in stored (underscore) form.
export function splitFullName(value: string): { firstName: string; lastName: string } {
  const [first = '', ...rest] = normalizeName(value).split(' ');
  return { firstName: first, lastName: rest.join('_') };
}

export function validateProfileDetails(input: ProfileDetailsInput): ProfileErrors {
  const errors: ProfileErrors = {};

  const name = validateFullName(input.name);
  if (name) errors.name = name;

  if (!input.phone.trim()) errors.phone = 'Mobile number is required.';
  else if (!/^[0-9]+$/.test(input.phone)) errors.phone = 'Mobile number must use digits only.';
  else if (!isValidPhone(input.phone)) errors.phone = 'Mobile number must be exactly 10 digits.';

  return errors;
}

export function profileUpdateData(input: ProfileDetailsInput, updatedAt: string) {
  const { firstName, lastName } = splitFullName(input.name);
  return {
    firstName,
    lastName,
    phone: input.phone,
    name: normalizeName(input.name),
    updatedAt,
  };
}

export async function submitProfileDetails(
  uid: string,
  input: ProfileDetailsInput,
  write: (uid: string, data: ReturnType<typeof profileUpdateData>) => Promise<void>,
  updatedAt = new Date().toISOString(),
): Promise<ProfileErrors> {
  const errors = validateProfileDetails(input);
  if (Object.keys(errors).length > 0) return errors;
  await write(uid, profileUpdateData(input, updatedAt));
  return {};
}
