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
    expect(Complaint.schema.path('sanctionIssued')).toBeDefined();
  });

  it('supports POSO road enforcement fields (source, posoOfficerId, posoBadgeNumber, posoEndorsementNotes)', () => {
    const sourceEnum = Complaint.schema.path('source').enumValues;
    expect(sourceEnum).toContain('commuter');
    expect(sourceEnum).toContain('poso_field_report');
    expect(Complaint.schema.path('posoOfficerId')).toBeDefined();
    expect(Complaint.schema.path('posoBadgeNumber')).toBeDefined();
    expect(Complaint.schema.path('posoEndorsementNotes')).toBeDefined();
    expect(Complaint.schema.path('posoEndorsedAt')).toBeDefined();
  });

  it('validates posoFieldReportSchema and posoEndorseSchema', () => {
    const { posoFieldReportSchema, posoEndorseSchema } = require('../../src/validators/complaintValidator');

    const validReport = posoFieldReportSchema.validate({
      subject: 'Reckless overtaking along Perez Blvd',
      description: 'Jeepney swerved into pedestrian lane during rush hour',
      vehiclePlateNumber: 'ABC-1234',
      category: 'reckless_driving',
      posoEndorsementNotes: 'Plate confirmed by Officer Diaz on site',
    });
    expect(validReport.error).toBeUndefined();

    const invalidReport = posoFieldReportSchema.validate({
      subject: 'Hi', // too short
      description: 'No', // too short
    });
    expect(invalidReport.error).toBeDefined();

    const validEndorse = posoEndorseSchema.validate({
      endorsementNotes: 'Verified on site. Driver confirmed vehicle number.',
    });
    expect(validEndorse.error).toBeUndefined();
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

  it('validates lguActionSchema requiring lguActionNotes and allowing sanctionIssued', () => {
    const valid = lguActionSchema.validate({
      lguActionNotes: 'Driver summoned to POSO office for verification.',
      sanctionIssued: 'Traffic Citation & Warning',
    });
    expect(valid.error).toBeUndefined();

    const invalid = lguActionSchema.validate({});
    expect(invalid.error).toBeDefined();
  });
});
