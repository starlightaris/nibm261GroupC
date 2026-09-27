export type ProfileDetailsInput = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type ProfileField = keyof ProfileDetailsInput;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export function normalizeProfileDetails(input: ProfileDetailsInput): ProfileDetailsInput {
  return {
    firstName: input.firstName.trim().replace(/\s+/g, ' '),
    lastName: input.lastName.trim().replace(/\s+/g, ' '),
    phone: input.phone.trim(),
  };
}

export function validateProfileDetails(input: ProfileDetailsInput): ProfileErrors {
  const details = normalizeProfileDetails(input);
  const errors: ProfileErrors = {};

  if (!details.firstName) errors.firstName = 'First name is required.';
  else if (details.firstName.length > 80) errors.firstName = 'First name must be 80 characters or fewer.';

  if (!details.lastName) errors.lastName = 'Last name is required.';
  else if (details.lastName.length > 80) errors.lastName = 'Last name must be 80 characters or fewer.';

  const digits = details.phone.replace(/\D/g, '');
  if (!details.phone) errors.phone = 'Mobile number is required.';
  else if (!/^\+?[0-9][0-9\s-]*$/.test(details.phone) || digits.length < 9 || digits.length > 15) {
    errors.phone = 'Enter a valid mobile number using 9 to 15 digits.';
  }

  return errors;
}

export function profileUpdateData(input: ProfileDetailsInput, updatedAt: string) {
  const details = normalizeProfileDetails(input);
  return {
    ...details,
    name: `${details.firstName} ${details.lastName}`,
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
