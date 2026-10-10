const Notification = require('../../src/models/Notification');
const {
  broadcastSchema,
  roadAlertRequestSchema,
  rejectRoadAlertSchema,
} = require('../../src/validators/notificationValidator');

describe('Notification Schema & Broadcast Approval Workflow', () => {
  it('supports status enum (pending_approval, published, rejected)', () => {
    const statusEnum = Notification.schema.path('status').enumValues;
    expect(statusEnum).toContain('pending_approval');
    expect(statusEnum).toContain('published');
    expect(statusEnum).toContain('rejected');
  });

  it('supports createdByRole enum (admin, lgu, poso, system)', () => {
    const roleEnum = Notification.schema.path('createdByRole').enumValues;
    expect(roleEnum).toContain('admin');
    expect(roleEnum).toContain('lgu');
    expect(roleEnum).toContain('poso');
    expect(roleEnum).toContain('system');
  });

  it('supports approval and road officer fields', () => {
    expect(Notification.schema.path('authorUser')).toBeDefined();
    expect(Notification.schema.path('approvedBy')).toBeDefined();
    expect(Notification.schema.path('approvedAt')).toBeDefined();
    expect(Notification.schema.path('rejectionReason')).toBeDefined();
    expect(Notification.schema.path('severity')).toBeDefined();
    expect(Notification.schema.path('locationArea')).toBeDefined();
  });

  it('validates roadAlertRequestSchema for POSO road drafts', () => {
    const valid = roadAlertRequestSchema.validate({
      title: 'Heavy Traffic at AB Fernandez',
      message: 'Road maintenance ongoing near plaza. Expect 15-minute delay.',
      severity: 'warning',
      locationArea: 'AB Fernandez East',
    });
    expect(valid.error).toBeUndefined();

    const invalid = roadAlertRequestSchema.validate({
      title: 'No', // too short
      message: 'Wait', // too short
    });
    expect(invalid.error).toBeDefined();
  });

  it('validates rejectRoadAlertSchema for LGU rejection desk', () => {
    const valid = rejectRoadAlertSchema.validate({
      reason: 'Issue already resolved by traffic enforcers.',
    });
    expect(valid.error).toBeUndefined();
  });
});
