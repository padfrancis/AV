// Email Service - Supabase Edge Function Integration
// This file handles sending emails via the Supabase Edge Function

const SUPABASE_URL = window.SUPABASE_URL || "https://rlgelnedymfzpyiddkna.supabase.co";

/**
 * Send email notification to applicant
 * @param {string} email - Recipient email
 * @param {string} type - 'submission', 'approved', or 'rejected'
 * @param {object} data - Application data {ign, adminNotes, etc}
 */
export async function sendEmailNotification(email, type, data = {}) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        type, // 'submission', 'approved', 'rejected'
        ign: data.ign,
        adminNotes: data.adminNotes,
        discordLink: data.discordLink || 'https://discord.com/invite/jBPFT3BGF'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to send ${type} email:`, error);
      return false;
    }

    console.log(`${type} email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

/**
 * Delete screenshots from storage
 */
export async function deleteScreenshots(supabase, screenshotPaths) {
  try {
    if (!screenshotPaths || screenshotPaths.length === 0) return true;

    const { error } = await supabase.storage
      .from('application-screenshots')
      .remove(screenshotPaths);

    if (error) {
      console.error('Failed to delete screenshots:', error);
      return false;
    }

    console.log(`Deleted ${screenshotPaths.length} screenshots`);
    return true;
  } catch (error) {
    console.error('Screenshot deletion error:', error);
    return false;
  }
}
