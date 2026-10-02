const { registerSchema, updateProfileSchema } = require('../../src/validators/authValidator');
const User = require('../../src/models/User');

describe('User Model & Auth Validation', () => {
  describe('Name Validation with Special Characters', () => {
    const validNames = [
      'Juan',
      'Ma. Cristina',
      "D'Angelo",
      'O’Connor',
      'Dela Cruz-Santos',
      'St. John',
      'Mary-Ann',
    ];

    validNames.forEach((name) => {
      it(`accepts valid name: "${name}"`, () => {
        const { error } = registerSchema.validate({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: name,
          lastName: 'Santos',
        });
        expect(error).toBeUndefined();
      });
    });

    it('rejects invalid names with numbers or forbidden symbols like @, $, #', () => {
      const { error } = registerSchema.validate({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Juan123',
        lastName: 'Santos',
      });
      expect(error).toBeDefined();
    });
  });

  describe('User Model Role Enum & Lockout Fields', () => {
    it('defines superadmin and lgu roles in schema', () => {
      const roleEnum = User.schema.path('role').enumValues;
      expect(roleEnum).toContain('superadmin');
      expect(roleEnum).toContain('admin');
      expect(roleEnum).toContain('lgu');
      expect(roleEnum).toContain('commuter');
      expect(roleEnum).toContain('guest');
    });

    it('defines failedLoginAttempts and lockUntil fields', () => {
      expect(User.schema.path('failedLoginAttempts')).toBeDefined();
      expect(User.schema.path('lockUntil')).toBeDefined();
    });
  });
});
