import { Resend } from 'resend'
import { createClient } from '../../../lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  // Verify the caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { clientEmail, clientName, projectName, projectId } = await request.json()

  if (!clientEmail || !projectName || !projectId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${projectId}`
  const firstName = clientName ? clientName.split(' ')[0] : 'there'

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: clientEmail,
      subject: `Your project is ready — ${projectName}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your project is ready</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Courier New',monospace;color:#f0ede8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <tr>
      <td>
        <!-- Logo -->
        <p style="font-size:22px;font-weight:300;letter-spacing:0.02em;margin:0 0 40px 0;font-family:Georgia,serif;">
          Vis<em style="font-style:italic;color:#c9a96e;">ora</em>
        </p>

        <!-- Divider -->
        <div style="width:100%;height:1px;background:rgba(240,237,232,0.07);margin-bottom:40px;"></div>

        <!-- Body -->
        <p style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a09890;margin:0 0 16px 0;">
          Project ready
        </p>

        <p style="font-size:28px;font-weight:300;font-family:Georgia,serif;margin:0 0 24px 0;line-height:1.2;">
          Hi ${firstName},<br/>your content is ready.
        </p>

        <p style="font-size:13px;line-height:1.75;color:#a09890;margin:0 0 8px 0;letter-spacing:0.05em;">
          Project
        </p>
        <p style="font-size:15px;margin:0 0 32px 0;color:#f0ede8;letter-spacing:0.05em;">
          ${projectName}
        </p>

        <p style="font-size:13px;line-height:1.75;color:#a09890;margin:0 0 24px 0;">
          Your AI-generated media is ready to preview. Log in to your Visora portal to view the results.
        </p>

        <!-- CTA -->
        <a href="${portalUrl}"
           style="display:inline-block;padding:14px 24px;border:1px solid #c9a96e;color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;background:rgba(201,169,110,0.1);">
          View your project →
        </a>

        <!-- Divider -->
        <div style="width:100%;height:1px;background:rgba(240,237,232,0.07);margin:48px 0 24px 0;"></div>

        <p style="font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(160,152,144,0.5);margin:0;">
          © 2026 Visora — AI Property Media
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Log the notification in the DB
    await supabase.from('notifications').insert({
      project_id: projectId,
      type: 'ready',
      sent_to: clientEmail,
      resend_id: data?.id,
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Notification error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
