export type ProfileDetailsInput = {
  firstName: string;
  lastName: string;
  phone: string;
};

export type ProfileField = keyof ProfileDetailsInput;
export type ProfileErrors = Partial<Record<ProfileField, string>>;

export function validateProfileDetails(input: ProfileDetailsInput): ProfileErrors {
  const errors: ProfileErrors = {};

  if (!input.firstName.trim()) errors.firstName = 'First name is required.';
  else if (input.firstName.length > 80) errors.firstName = 'First name must be 80 characters or fewer.';
  else if (!/^[A-Za-z]+$/.test(input.firstName)) errors.firstName = 'First name must use letters A-Z only, with no spaces or symbols.';

  if (!input.lastName.trim()) errors.lastName = 'Last name is required.';
  else if (input.lastName.length > 80) errors.lastName = 'Last name must be 80 characters or fewer.';
  else if (!/^[A-Za-z]+$/.test(input.lastName)) errors.lastName = 'Last name must use letters A-Z only, with no spaces or symbols.';

  if (!input.phone.trim()) errors.phone = 'Mobile number is required.';
  else if (!/^[0-9]+$/.test(input.phone)) errors.phone = 'Mobile number must use digits only.';
  else if (input.phone.length !== 10) errors.phone = 'Mobile number must be exactly 10 digits.';

  return errors;
}

export function profileUpdateData(input: ProfileDetailsInput, updatedAt: string) {
  return {
    ...input,
    name: `${input.firstName} ${input.lastName}`,
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
