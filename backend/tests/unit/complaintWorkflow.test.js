const Complaint = require('../../src/models/Complaint');
const {
  createComplaintSchema,
  deleteComplaintSchema,
  lguActionSchema,
  lguTerminateSchema,
} = require('../../src/validators/complaintValidator');

describe('Complaint Schema & Validation Rules', () => {
  it('supports new statuses including endorsed_to_lgu, action_taken, terminated, deleted', () => {
    const statusEnum = Complaint.schema.path('status').enumValues;
    expect(statusEnum).toContain('pending');
    expect(statusEnum).toContain('under_review');
    expect(statusEnum).toContain('endorsed_to_lgu');
    expect(statusEnum).toContain('action_taken');
    expect(statusEnum).toContain('terminated');
    expect(statusEnum).toContain('deleted');
  });

  it('supports deletion reason and LGU tracking fields in schema', () => {
    expect(Complaint.schema.path('deletionReason')).toBeDefined();
    expect(Complaint.schema.path('deletedBy')).toBeDefined();
    expect(Complaint.schema.path('lguActionNotes')).toBeDefined();
    expect(Complaint.schema.path('lguTerminatedAt')).toBeDefined();
  });

  it('validates deleteComplaintSchema requiring valid deletionReason', () => {
    const valid = deleteComplaintSchema.validate({
      deletionReason: 'Spam / False Information',
      deletionNotes: 'No vehicle plate or clear grievance details provided.',
    });
    expect(valid.error).toBeUndefined();

    const invalid = deleteComplaintSchema.validate({
      deletionReason: 'Invalid Reason Not In Dropdown',
    });
    expect(invalid.error).toBeDefined();

    const missing = deleteComplaintSchema.validate({});
    expect(missing.error).toBeDefined();
  });

  it('validates lguActionSchema requiring lguActionNotes', () => {
    const valid = lguActionSchema.validate({
      lguActionNotes: 'Driver summoned to POSO office for verification.',
    });
    expect(valid.error).toBeUndefined();

    const invalid = lguActionSchema.validate({});
    expect(invalid.error).toBeDefined();
  });
});
