// Server-side Witney Wire form endpoint (Cloudflare Pages Functions).
// No credentials or visitor details are committed to GitHub.
const SETTINGS = {
  advertise: {
    recipient: "advertise@witneywire.co.uk",
    subject: "New advertising enquiry - Witney Wire",
    fields: ["Name", "Business", "Email", "Phone", "Advertising interest", "Message"],
    required: ["Name", "Email"]
  },
  newsletter: {
    recipient: "subscribe@witneywire.co.uk",
    subject: "New newsletter subscription - Witney Wire",
    fields: ["Name", "Email", "Postcode or area", "Subscription preference", "Message", "GDPR consent"],
    required: ["Name", "Email", "GDPR consent"]
  },
  subscribe: {
    recipient: "subscribe@witneywire.co.uk",
    subject: "New subscription request - Witney Wire",
    fields: ["Name", "Email", "Postcode or area", "Subscription preference", "Message", "GDPR consent"],
    required: ["Name", "Email", "GDPR consent"]
  },
  "send-story": {
    recipient: "contact@witneywire.co.uk",
    subject: "New story submission - Witney Wire",
    fields: ["Name", "Email", "Story topic", "Story details"],
    required: ["Name", "Email", "Story details"]
  }
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

// Branded, email-client-friendly internal notification. All visitor content is escaped.
function buildNotificationHtml(config, kind, values, origin, receivedAt) {
  const titles = {
    advertise: "New advertising enquiry",
    newsletter: "New newsletter subscription",
    subscribe: "New subscription request",
    "send-story": "New story submission"
  };
  const headline = titles[kind] || "New website message";
  const rows = config.fields.map(field => {
    const value = values[field] || "Not provided";
    const display = escapeHTML(value).replace(/\r?\n/g, "<br>");
    return '<tr><td style="padding:12px 16px;border-bottom:1px solid #e8edf1;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#526477;vertical-align:top;width:34%">' +
      escapeHTML(field) +
      '</td><td style="padding:12px 16px;border-bottom:1px solid #e8edf1;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#102b47;vertical-align:top;word-break:break-word">' +
      display + '</td></tr>';
  }).join("");

  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
    '<body style="margin:0;padding:0;background:#f3f6f8;font-family:Arial,sans-serif">' +
    '<div style="display:none;font-size:1px;color:#f3f6f8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">New Witney Wire website enquiry</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f3f6f8"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:620px;background:#ffffff;border:1px solid #e5ebee">' +
    '<tr><td style="padding:22px 26px;background:#082846;border-top:4px solid #327352">' +
    '<p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:.2px">Witney Wire</p>' +
    '<p style="margin:5px 0 0;color:#bfd8c9;font-size:12px">Your Town. Your Stories.</p></td></tr>' +
    '<tr><td style="padding:26px 26px 12px">' +
    '<p style="margin:0 0 8px;color:#327352;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Website notification</p>' +
    '<h1 style="margin:0 0 12px;color:#082846;font-size:24px;line-height:1.3">' + escapeHTML(headline) + '</h1>' +
    '<p style="margin:0;color:#526477;font-size:13px;line-height:1.6">Received: ' + escapeHTML(receivedAt) + ' (UTC)</p>' +
    '</td></tr><tr><td style="padding:12px 26px 24px">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e8edf1;border-collapse:collapse">' + rows + '</table>' +
    '<p style="margin:20px 0 0;color:#526477;font-size:13px;line-height:1.6">To respond, use <strong>Reply</strong> in your email application. Your reply will be addressed to the person who submitted the form.</p>' +
    '</td></tr><tr><td style="padding:14px 26px;background:#f7f9fa;border-top:1px solid #e8edf1">' +
    '<p style="margin:0;color:#657586;font-size:11px;line-height:1.6">Internal Witney Wire form notification. Sent from: ' + escapeHTML(origin) + '. Please handle personal information according to your privacy policy.</p>' +
    '</td></tr></table></td></tr></table></body></html>';
}

function errorResponse(message, status) {
  const page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Form unavailable | Witney Wire</title><link rel="stylesheet" href="/styles.css"></head><body><main style="max-width:640px;margin:8vh auto;padding:24px;font-family:Arial,sans-serif"><h1>We could not send your message</h1><p>' +
    escapeHTML(message) + '</p><p>Nothing has been confirmed as sent. Please email <a href="mailto:contact@witneywire.co.uk">contact@witneywire.co.uk</a> directly, or go back to try again.</p><p><a href="/">Return to Witney Wire</a></p></main></body></html>';
  return new Response(page, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}

function configured(env) {
  return Boolean(env.RESEND_API_KEY && env.FORM_FROM && env.TURNSTILE_SECRET_KEY && env.TURNSTILE_SITE_KEY);
}

export async function onRequestGet({ env }) {
  if (!configured(env)) {
    return new Response(JSON.stringify({ error: "Form service is not yet configured." }), {
      status: 503, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
    });
  }
  return new Response(JSON.stringify({ siteKey: env.TURNSTILE_SITE_KEY }), {
    status: 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}

export async function onRequestPost({ request, env }) {
  if (!configured(env)) {
    return errorResponse("The secure form service is not ready yet.", 503);
  }
  const ownOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== ownOrigin) {
    return errorResponse("This submission came from an unexpected website.", 403);
  }
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
    return errorResponse("The form submission was not in the expected format.", 415);
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 16000) {
    return errorResponse("Your message is too long. Please email us instead.", 413);
  }

  let params;
  try {
    const raw = await request.text();
    if (raw.length > 16000) return errorResponse("Your message is too long.", 413);
    params = new URLSearchParams(raw);
    if (Array.from(params.keys()).length > 25) return errorResponse("Too many form fields.", 400);
  } catch {
    return errorResponse("We could not read your submission.", 400);
  }

  const kind = String(params.get("form_kind") || "");
  const config = SETTINGS[kind];
  if (!config) return errorResponse("This form type is not recognised.", 400);

  // Existing hidden honeypot. No response to automated submissions.
  if (params.get("_honey")) {
    return Response.redirect(ownOrigin + "/thanks.html", 303);
  }

  const values = {};
  for (const field of config.fields) {
    const value = String(params.get(field) || "").trim();
    if (value.length > (field === "Message" || field === "Story details" ? 6000 : 400)) {
      return errorResponse("One of your form fields is too long.", 400);
    }
    values[field] = value;
  }
  if (config.required.some(field => !values[field])) {
    return errorResponse("Please complete all required fields.", 400);
  }
  if ((kind === "subscribe" || kind === "newsletter") && values["GDPR consent"] !== "on") {
    return errorResponse("Consent is required to request newsletter updates.", 400);
  }
  const replyAddress = values.Email;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(replyAddress) || replyAddress.length > 254) {
    return errorResponse("Please provide a valid email address.", 400);
  }

  const token = String(params.get("cf-turnstile-response") || "");
  if (!token || token.length > 2048) {
    return errorResponse("Please complete the security verification and try again.", 400);
  }
  let verified;
  try {
    const body = new FormData();
    body.append("secret", env.TURNSTILE_SECRET_KEY);
    body.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) body.append("remoteip", ip);
    const check = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body
    });
    if (!check.ok) throw new Error("Verification service response");
    verified = await check.json();
  } catch {
    return errorResponse("Security verification is temporarily unavailable. Please try again.", 503);
  }
  if (!verified.success || verified.hostname !== new URL(request.url).hostname) {
    return errorResponse("Security verification failed or expired. Please go back and try again.", 403);
  }

  const details = [
    "Witney Wire website enquiry",
    "Form: " + kind,
    "Received: " + new Date().toISOString(),
    "Website: " + ownOrigin,
    "",
    ...config.fields.map(field => field + ": " + (values[field] || "(not provided)"))
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "authorization": "Bearer " + env.RESEND_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from: env.FORM_FROM,
        to: [config.recipient],
        reply_to: replyAddress,
        subject: config.subject,
        text: details,
        html: buildNotificationHtml(config, kind, values, ownOrigin, new Date().toISOString())
      })
    });
    if (!response.ok) {
      // Don't log email addresses, names, or submitted content.
      console.error("Witney Wire email provider returned status", response.status);
      return errorResponse("The email service could not accept your message. Please email us directly.", 502);
    }
  } catch {
    return errorResponse("The email service could not be reached. Please email us directly.", 502);
  }
  // Only a successful provider response gets the thank-you page.
  return Response.redirect(ownOrigin + "/thanks.html", 303);
}