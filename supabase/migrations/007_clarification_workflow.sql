-- ============================================================
-- Migration 007: Clarification Response Workflow
-- ============================================================

-- Add 'resubmitted' to the status constraint
-- First, drop the old constraint and recreate with new status values
ALTER TABLE nominations
  DROP CONSTRAINT IF EXISTS "nominations_status_check",
  ADD CONSTRAINT "nominations_status_check" 
  CHECK (status IN ('draft', 'pending', 'clarification_requested', 'resubmitted', 'approved', 'rejected'));

-- Create clarification_responses table to store history of employee responses
CREATE TABLE IF NOT EXISTS clarification_responses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  nomination_id         UUID NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  responder_id          UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  
  -- Response content
  response_text         TEXT NOT NULL,
  
  -- Metadata
  clarification_note_id TEXT,  -- Optional: reference to the specific clarification note that prompted this response
  
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clarification_responses_nomination_id ON clarification_responses(nomination_id);
CREATE INDEX idx_clarification_responses_responder_id ON clarification_responses(responder_id);
CREATE INDEX idx_clarification_responses_created_at ON clarification_responses(created_at DESC);

CREATE TRIGGER set_clarification_responses_updated_at
  BEFORE UPDATE ON clarification_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE clarification_responses ENABLE ROW LEVEL SECURITY;

-- Nominator can read their own clarification responses
CREATE POLICY "clarification_responses_read_responder" ON clarification_responses
  FOR SELECT USING (
    responder_id = (auth.jwt()->>'employee_id')::uuid
  );

-- Approvers can read clarification responses for nominations assigned to them
CREATE POLICY "clarification_responses_read_approver" ON clarification_responses
  FOR SELECT USING (
    (auth.jwt()->>'user_role')::text IN ('manager', 'hr_admin', 'super_admin') AND
    EXISTS (
      SELECT 1 FROM nominations
      WHERE nominations.id = clarification_responses.nomination_id
      AND (
        nominations.assigned_approver_id = (auth.jwt()->>'employee_id')::uuid
        OR (auth.jwt()->>'user_role')::text IN ('hr_admin', 'super_admin')
      )
    )
  );

-- HR can read all clarification responses
CREATE POLICY "clarification_responses_hr_read_all" ON clarification_responses
  FOR SELECT USING ((auth.jwt()->>'user_role')::text IN ('hr_admin', 'super_admin'));

-- Nominator can insert their own response
CREATE POLICY "clarification_responses_insert" ON clarification_responses
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    responder_id = (auth.jwt()->>'employee_id')::uuid
  );

-- Update nominations RLS policies to include 'resubmitted' status
-- Nominees can see their clarification_requested and resubmitted recognitions
DROP POLICY IF EXISTS "nominations_read_nominee_approved" ON nominations;
CREATE POLICY "nominations_read_nominee_approved" ON nominations
  FOR SELECT USING (
    nominee_id = (auth.jwt()->>'employee_id')::uuid AND
    status IN ('approved', 'clarification_requested', 'resubmitted')
  );

-- Nominator can update resubmitted nominations (not just draft and clarification_requested)
-- Actually, resubmitted should be read-only for nominator at this point - the update happens via edge function
-- Keep the update policy as-is, but clarify in comments:
-- nominator updates happen through Edge Function when status changes to 'resubmitted'

COMMENT ON TABLE clarification_responses IS
  'Stores employee responses to manager clarification requests. Each response is timestamped and immutable. ' ||
  'Preserves complete clarification history. When nominator submits a response, ' ||
  'a new row is inserted and nominations.status becomes "resubmitted" for manager re-review.';

COMMENT ON COLUMN clarification_responses.response_text IS
  'Employee''s additional information provided in response to the clarification request.';

COMMENT ON COLUMN nominations.clarification_responded_at IS
  'Timestamp when nominator submitted clarification response. Triggers re-entry to approval queue.';

COMMENT ON COLUMN nominations.status IS
  'Workflow state: draft → pending → {approved | rejected | clarification_requested} → resubmitted → pending (re-review)';
