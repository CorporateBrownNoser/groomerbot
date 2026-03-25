import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VAPI_API_KEY = process.env.VAPI_API_KEY!;
const VAPI_BASE = "https://api.vapi.ai";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function vapiRequest(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${VAPI_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Vapi] ${path} failed (${res.status}): ${text}`);
    throw new Error(`Vapi API error: ${res.status} — ${text}`);
  }

  return res.json();
}

export async function POST(request: Request) {
  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    console.log(`[Vapi Provision] Starting provisioning for client: ${clientId}`);

    const supabase = getAdminClient();

    // Fetch client data
    const { data: client, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (fetchError || !client) {
      console.error(`[Vapi Provision] Client not found:`, fetchError);
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // If already provisioned, return existing data
    if (client.vapi_assistant_id && client.vapi_phone_number) {
      console.log(
        `[Vapi Provision] Client already provisioned: ${client.vapi_phone_number}`
      );
      return NextResponse.json({
        assistantId: client.vapi_assistant_id,
        phoneNumber: client.vapi_phone_number,
      });
    }

    const businessName = client.business_name;
    const ownerName = client.owner_name;
    const servicesPricing = client.services_pricing || "Contact us for pricing.";

    // 1. Create the Vapi assistant
    console.log(`[Vapi Provision] Creating assistant for: ${businessName}`);

    const systemPrompt = `You are a friendly, professional AI receptionist for ${businessName}, a dog grooming business owned by ${ownerName}.

Your job is to:
1. Greet callers warmly and identify yourself as ${businessName}'s receptionist.
2. Answer questions about services and pricing. Here are the services offered:

${servicesPricing}

3. If the caller wants to book an appointment, collect:
   - Their full name
   - Their dog's name
   - The dog's breed and size
   - Which service they want
   - Their preferred date and time

4. Let the caller know that ${ownerName} will confirm the appointment shortly.
5. Be warm, patient, and helpful. Many callers are dog lovers — be enthusiastic about their pets!
6. If you don't know something, say you'll have ${ownerName} call them back.
7. Keep responses concise and conversational — this is a phone call, not an essay.
8. At the end of the call, summarize what was discussed and thank them for calling ${businessName}.`;

    const assistant = await vapiRequest("/assistant", {
      name: `${businessName} Receptionist`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",  // "Rachel" — warm, friendly
        stability: 0.5,
        similarityBoost: 0.75,
      },
      firstMessage: `Hi! Thanks for calling ${businessName}. This is ${businessName}'s AI receptionist. How can I help you today?`,
      serverUrl: `https://groomerbot.vercel.app/api/vapi/webhook`,
      endCallMessage: `Thank you so much for calling ${businessName}! ${ownerName} will follow up with you shortly. Have a wonderful day!`,
    });

    console.log(
      `[Vapi Provision] Assistant created: ${assistant.id}`
    );

    // 2. Provision a Vapi phone number
    console.log(`[Vapi Provision] Provisioning phone number...`);

    let phoneNumber: string;
    let phoneNumberId: string;

    try {
      const phone = await vapiRequest("/phone-number", {
        assistantId: assistant.id,
        provider: "vapi",
      });

      phoneNumber = phone.number;
      phoneNumberId = phone.id;
      console.log(
        `[Vapi Provision] Phone number provisioned: ${phoneNumber} (${phoneNumberId})`
      );
    } catch (phoneError) {
      // If phone provisioning fails, still save the assistant
      console.error(
        `[Vapi Provision] Phone number provisioning failed, saving assistant only:`,
        phoneError
      );

      await supabase
        .from("clients")
        .update({ vapi_assistant_id: assistant.id })
        .eq("id", clientId);

      return NextResponse.json({
        assistantId: assistant.id,
        phoneNumber: null,
        warning: "Phone number provisioning failed. Assistant was created.",
      });
    }

    // 3. Save everything to the client record
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        vapi_assistant_id: assistant.id,
        vapi_phone_number: phoneNumber,
        vapi_phone_number_id: phoneNumberId,
      })
      .eq("id", clientId);

    if (updateError) {
      console.error(`[Vapi Provision] Failed to save to DB:`, updateError);
    }

    console.log(
      `[Vapi Provision] Provisioning complete for ${businessName}: ${phoneNumber}`
    );

    return NextResponse.json({
      assistantId: assistant.id,
      phoneNumber,
      phoneNumberId,
    });
  } catch (err) {
    console.error(`[Vapi Provision] Unhandled error:`, err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Provisioning failed",
      },
      { status: 500 }
    );
  }
}
