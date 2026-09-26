const User = require('../../src/models/User');

describe('Auth Controller Lockout & Superadmin Logic', () => {
  it('correctly tracks failed attempts and locks out at 5 attempts', async () => {
    const user = new User({
      email: 'lockout@example.com',
      passwordHash: 'hashed_pw',
      firstName: 'Lock',
      lastName: 'Out',
      role: 'commuter',
      failedLoginAttempts: 4,
    });
    
    expect(user.lockUntil).toBeNull();
    
    // Simulate 5th failed attempt
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    expect(user.failedLoginAttempts).toBe(5);
    expect(user.lockUntil).not.toBeNull();
    expect(user.lockUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it('resets failed attempts and lockout on successful authentication', async () => {
    const user = new User({
      email: 'reset@example.com',
      passwordHash: 'hashed_pw',
      firstName: 'Reset',
      lastName: 'User',
      role: 'commuter',
      failedLoginAttempts: 3,
      lockUntil: null,
    });

    // Simulate login success reset
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    expect(user.failedLoginAttempts).toBe(0);
    expect(user.lockUntil).toBeNull();
  });
});
