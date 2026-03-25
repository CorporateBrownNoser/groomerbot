import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const messageType = payload.message?.type || payload.type;

    console.log(`[Vapi Webhook] Received event: ${messageType}`);

    // We only care about end-of-call-report
    if (messageType !== "end-of-call-report") {
      return NextResponse.json({ received: true });
    }

    const message = payload.message || payload;
    const call = message.call || {};
    const assistantId = call.assistantId || message.assistantId;
    const callerPhone = call.customer?.number || "Unknown";
    const callDuration = message.durationSeconds || call.duration || 0;
    const callSummary = message.summary || message.analysis?.summary || "No summary available.";
    const transcript = message.transcript || "";
    const recordingUrl = message.recordingUrl || call.recordingUrl || null;

    console.log(
      `[Vapi Webhook] End-of-call for assistant ${assistantId}, caller: ${callerPhone}, duration: ${callDuration}s`
    );

    const supabase = getAdminClient();

    // Look up the client by their assistant ID
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, email, business_name, owner_name")
      .eq("vapi_assistant_id", assistantId)
      .maybeSingle();

    if (clientError || !client) {
      console.error(
        `[Vapi Webhook] Could not find client for assistant ${assistantId}:`,
        clientError
      );
      // Still return 200 so Vapi doesn't retry
      return NextResponse.json({ received: true, warning: "Client not found" });
    }

    console.log(
      `[Vapi Webhook] Matched client: ${client.business_name} (${client.id})`
    );

    // Parse structured data from the analysis if available
    const analysis = message.analysis || {};
    const structuredData = analysis.structuredData || {};
    const callerName = structuredData.callerName || extractFromTranscript(transcript, "name") || "Unknown Caller";
    const dogName = structuredData.dogName || extractFromTranscript(transcript, "dog") || null;

    // Insert call log
    const { error: insertError } = await supabase.from("call_logs").insert({
      client_id: client.id,
      caller_name: callerName,
      caller_phone: callerPhone,
      dog_name: dogName,
      summary: callSummary,
      duration_seconds: Math.round(callDuration),
      recording_url: recordingUrl,
    });

    if (insertError) {
      console.error(`[Vapi Webhook] Failed to insert call log:`, insertError);
    } else {
      console.log(`[Vapi Webhook] Call log saved for ${client.business_name}`);
    }

    // Check if an appointment was requested
    const serviceType = structuredData.serviceRequested || null;
    const requestedDate = structuredData.preferredDate || null;

    if (serviceType || requestedDate || (callSummary && callSummary.toLowerCase().includes("appointment"))) {
      const { error: aptError } = await supabase.from("appointments").insert({
        client_id: client.id,
        customer_name: callerName,
        dog_name: dogName,
        service_type: serviceType || "See call summary",
        requested_date: requestedDate ? new Date(requestedDate).toISOString() : null,
        status: "pending",
      });

      if (aptError) {
        console.error(`[Vapi Webhook] Failed to insert appointment:`, aptError);
      } else {
        console.log(
          `[Vapi Webhook] Appointment created for ${callerName}`
        );
      }
    }

    // Send email notification via Resend
    try {
      const durationMin = Math.floor(callDuration / 60);
      const durationSec = Math.round(callDuration % 60);

      await getResend().emails.send({
        from: "GroomerBot <onboarding@resend.dev>",
        to: client.email,
        subject: `New Call Summary — ${callerName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
            <div style="background: #FDFBF7; border: 1px solid #E2DDD6; border-radius: 16px; padding: 32px;">
              <h2 style="color: #2C2926; margin: 0 0 4px;">New Call for ${client.business_name}</h2>
              <p style="color: #7A7268; font-size: 14px; margin: 0 0 24px;">Your AI receptionist just handled a call.</p>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #7A7268; font-size: 14px; width: 120px;">Caller</td>
                  <td style="padding: 8px 0; color: #2C2926; font-size: 14px; font-weight: 500;">${callerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #7A7268; font-size: 14px;">Phone</td>
                  <td style="padding: 8px 0; color: #2C2926; font-size: 14px;">${callerPhone}</td>
                </tr>
                ${dogName ? `
                <tr>
                  <td style="padding: 8px 0; color: #7A7268; font-size: 14px;">Dog</td>
                  <td style="padding: 8px 0; color: #2C2926; font-size: 14px;">${dogName}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 8px 0; color: #7A7268; font-size: 14px;">Duration</td>
                  <td style="padding: 8px 0; color: #2C2926; font-size: 14px;">${durationMin}m ${durationSec}s</td>
                </tr>
              </table>

              <div style="margin-top: 20px; padding: 16px; background: #F0ECE6; border-radius: 12px;">
                <p style="color: #7A7268; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px;">Call Summary</p>
                <p style="color: #2C2926; font-size: 14px; line-height: 1.6; margin: 0;">${callSummary}</p>
              </div>

              ${serviceType ? `
              <div style="margin-top: 16px; padding: 12px 16px; background: #7C8C6E10; border: 1px solid #7C8C6E30; border-radius: 12px;">
                <p style="color: #5A6B4E; font-size: 13px; margin: 0;">
                  <strong>Appointment Requested:</strong> ${serviceType}${requestedDate ? ` — ${requestedDate}` : ""}
                </p>
              </div>
              ` : ""}

              <p style="color: #9E9588; font-size: 12px; margin: 24px 0 0; text-align: center;">
                Sent by GroomerBot — your AI receptionist
              </p>
            </div>
          </div>
        `,
      });

      console.log(`[Vapi Webhook] Email sent to ${client.email}`);
    } catch (emailErr) {
      console.error(`[Vapi Webhook] Failed to send email:`, emailErr);
      // Don't fail the webhook because of email issues
    }

    return NextResponse.json({ received: true, success: true });
  } catch (err) {
    console.error(`[Vapi Webhook] Unhandled error:`, err);
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

/** Simple heuristic to extract info from a transcript string */
function extractFromTranscript(transcript: string, field: "name" | "dog"): string | null {
  if (!transcript || typeof transcript !== "string") return null;

  // These are rough heuristics — the structured data from Vapi analysis is preferred
  if (field === "name") {
    const nameMatch = transcript.match(
      /my name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i
    );
    return nameMatch ? nameMatch[1] : null;
  }

  if (field === "dog") {
    const dogMatch = transcript.match(
      /(?:dog(?:'s)? name is|my dog|dog named) ([A-Z][a-z]+)/i
    );
    return dogMatch ? dogMatch[1] : null;
  }

  return null;
}
