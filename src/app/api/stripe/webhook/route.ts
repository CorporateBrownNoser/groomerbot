import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  const supabase = getAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerEmail = session.customer_details?.email;
        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        console.log(
          `[Stripe Webhook] Checkout completed for: ${customerEmail}, customer: ${stripeCustomerId}`
        );

        if (customerEmail) {
          // Try to find existing client by email, or update if exists
          const { data: existing } = await supabase
            .from("clients")
            .select("id")
            .eq("email", customerEmail)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("clients")
              .update({
                subscription_status: "active",
                stripe_customer_id: stripeCustomerId || null,
              })
              .eq("id", existing.id);
            console.log(
              `[Stripe Webhook] Updated existing client: ${existing.id}`
            );
          } else {
            // Client will be created during onboarding — store mapping for later
            // We'll match by email when the user completes /welcome
            console.log(
              `[Stripe Webhook] No client record yet for ${customerEmail}, will match during onboarding`
            );
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        console.log(
          `[Stripe Webhook] Subscription deleted for customer: ${customerId}`
        );

        if (customerId) {
          await supabase
            .from("clients")
            .update({ subscription_status: "cancelled" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        console.log(
          `[Stripe Webhook] Payment failed for customer: ${customerId}`
        );

        if (customerId) {
          await supabase
            .from("clients")
            .update({ subscription_status: "past_due" })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing event:`, err);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
