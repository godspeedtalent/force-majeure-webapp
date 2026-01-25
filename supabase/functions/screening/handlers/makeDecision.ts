/**
 * Handler for making approval/rejection decisions
 */

import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import { validateInput, MakeDecisionSchema } from '../../_shared/validation.ts';
import { sendDecisionNotification } from '../utils/notifications.ts';

/**
 * Approve or reject a submission
 * Sends notification email to artist
 */
export async function makeDecision(
  supabase: SupabaseClient,
  user: User,
  params: unknown
) {
  // Validate input
  const decision = validateInput(MakeDecisionSchema, params);

  // Check if submission exists and is pending
  const { data: submission, error: submissionError } = await supabase
    .from('screening_submissions')
    .select(`
      id,
      status,
      artist:artists!inner (
        id,
        name,
        user_id,
        user:profiles!inner (
          email,
          display_name
        )
      )
    `)
    .eq('id', decision.submission_id)
    .single() as { data: { id: string; status: string; artist: { id: string; name: string; user_id: string; user: { email: string; display_name: string } } } | null; error: any };

  if (submissionError || !submission) {
    throw new Error('Submission not found');
  }

  if (submission.status !== 'pending') {
    throw new Error('Can only make decisions on pending submissions');
  }

  // Update submission status
  const { data: updatedSubmission, error: updateError } = await supabase
    .from('screening_submissions')
    .update({
      status: decision.status,
      decided_at: new Date().toISOString(),
      decided_by: user.id,
      decision_notes: decision.decision_notes,
    })
    .eq('id', decision.submission_id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating submission:', updateError);
    throw new Error(`Failed to make decision: ${updateError.message}`);
  }

  // Send notification email to artist
  try {
    await sendDecisionNotification(supabase, {
      artistName: submission.artist.name,
      artistEmail: submission.artist.user.email,
      status: decision.status,
      notes: decision.decision_notes,
    });
  } catch (emailError) {
    // Log email error but don't fail the decision
    console.error('Failed to send decision notification:', emailError);
  }

  return updatedSubmission;
}
