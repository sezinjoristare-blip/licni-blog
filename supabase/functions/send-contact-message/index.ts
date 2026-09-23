const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const {
      name,
      email,
      subject,
      message,
      website,
    } = await req.json();

    // Honeypot polje protiv prostih botova.
    if (website) {
      return new Response(
        JSON.stringify({
          success: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const cleanName =
      String(name || "").trim();

    const cleanEmail =
      String(email || "").trim();

    const cleanSubject =
      String(subject || "").trim();

    const cleanMessage =
      String(message || "").trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanSubject ||
      !cleanMessage
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Недостају обавезна поља.",
        }),
        {
          status: 400,

          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      cleanName.length > 80 ||
      cleanEmail.length > 160 ||
      cleanSubject.length > 140 ||
      cleanMessage.length > 5000
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Порука садржи превише текста.",
        }),
        {
          status: 400,

          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const resendApiKey =
      Deno.env.get(
        "RESEND_API_KEY"
      );

    const contactToEmail =
      Deno.env.get(
        "CONTACT_TO_EMAIL"
      );

    if (
      !resendApiKey ||
      !contactToEmail
    ) {
      throw new Error(
        "Недостаје конфигурација за слање мејла."
      );
    }

    const resendResponse =
      await fetch(
        "https://api.resend.com/emails",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${resendApiKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            from:
              "Seki Blog <onboarding@resend.dev>",

            to: [
              contactToEmail,
            ],

            reply_to:
              cleanEmail,

            subject:
              `[Секијев сајт] ${cleanSubject}`,

            text:
              `Име: ${cleanName}
Е-мејл: ${cleanEmail}

Наслов:
${cleanSubject}

Порука:
${cleanMessage}`,
          }),
        }
      );

    const resendData =
      await resendResponse.json();

    if (
      !resendResponse.ok
    ) {
      console.error(
        "Resend greška:",
        resendData
      );

      throw new Error(
        "Слање поруке није успело."
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "send-contact-message:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Порука тренутно не може да се пошаље.",
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});