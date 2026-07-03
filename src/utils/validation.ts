// Checks correct email prompt
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// Checks phone number
export const isValidMobile = (mobile: string): boolean =>
  /^[0-9]{9,15}$/.test(mobile.replace(/[\s+-]/g, ''));

// Checks vehicle number
export const isValidVehicleNumber = (value: string): boolean =>
  /^[A-Za-z0-9\- ]{4,12}$/.test(value.trim());

// Password must be at least 8 characters, with 1 letter and 1 number
export const isStrongPassword = (password: string): boolean =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

// when password is weak gives a masseage
export const passwordStrengthMessage = (password: string): string => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must include a letter';
  if (!/\d/.test(password)) return 'Password must include a number';
  return '';
};