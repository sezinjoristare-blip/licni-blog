import {
  withSupabase,
} from "@supabase/server";


const ALLOWED_TOPICS =
  new Set([
    "all",
    "board",
    "notebook",
    "posters",
    "boombox",
    "adventures",
    "skate_world",
    "quick_wits",
  ]);


function normalizeTopics(
  input: unknown
) {
  if (
    !Array.isArray(input)
  ) {
    return [
      "all",
    ];
  }


  const topics =
    [
      ...new Set(
        input.filter(
          (topic) =>
            typeof topic ===
              "string" &&
            ALLOWED_TOPICS.has(
              topic
            )
        )
      ),
    ];


  if (
    topics.includes(
      "all"
    )
  ) {
    return [
      "all",
    ];
  }


  return topics.length
    ? topics
    : [
        "all",
      ];
}


export default {
  fetch:
    withSupabase(
      {
        auth:
          "publishable",
      },

      async (
        req,
        ctx
      ) => {
        if (
          req.method !==
          "POST"
        ) {
          return Response.json(
            {
              error:
                "Method not allowed",
            },
            {
              status:
                405,
            }
          );
        }


        let body:
          Record<
            string,
            unknown
          >;


        try {
          body =
            await req.json();
        } catch {
          return Response.json(
            {
              error:
                "Neispravan JSON.",
            },
            {
              status:
                400,
            }
          );
        }


        if (
          body.action ===
          "upsert"
        ) {
          const subscription =
            body.subscription as
              | {
                  endpoint?:
                    string;

                  keys?: {
                    p256dh?:
                      string;

                    auth?:
                      string;
                  };
                }
              | undefined;


          const endpoint =
            subscription
              ?.endpoint;

          const p256dh =
            subscription
              ?.keys
              ?.p256dh;

          const auth =
            subscription
              ?.keys
              ?.auth;


          if (
            !endpoint ||
            !p256dh ||
            !auth
          ) {
            return Response.json(
              {
                error:
                  "Push subscription nije potpun.",
              },
              {
                status:
                  400,
              }
            );
          }


          const topics =
            normalizeTopics(
              body.topics
            );


          const userAgent =
            typeof body
              .userAgent ===
              "string"
              ? body.userAgent
              : null;


          const {
            error,
          } =
            await ctx
              .supabaseAdmin
              .from(
                "push_subscriptions"
              )
              .upsert(
                {
                  endpoint,
                  p256dh,
                  auth,
                  topics,

                  user_agent:
                    userAgent,

                  updated_at:
                    new Date()
                      .toISOString(),
                },
                {
                  onConflict:
                    "endpoint",
                }
              );


          if (error) {
            console.error(
              error
            );


            return Response.json(
              {
                error:
                  "Pretplata nije sačuvana.",
              },
              {
                status:
                  500,
              }
            );
          }


          return Response.json({
            ok: true,
            topics,
          });
        }


        if (
          body.action ===
          "remove"
        ) {
          const endpoint =
            typeof body
              .endpoint ===
              "string"
              ? body.endpoint
              : "";


          if (!endpoint) {
            return Response.json(
              {
                error:
                  "Nedostaje endpoint.",
              },
              {
                status:
                  400,
              }
            );
          }


          const {
            error,
          } =
            await ctx
              .supabaseAdmin
              .from(
                "push_subscriptions"
              )
              .delete()
              .eq(
                "endpoint",
                endpoint
              );


          if (error) {
            console.error(
              error
            );


            return Response.json(
              {
                error:
                  "Pretplata nije obrisana.",
              },
              {
                status:
                  500,
              }
            );
          }


          return Response.json({
            ok: true,
          });
        }


        return Response.json(
          {
            error:
              "Nepoznata akcija.",
          },
          {
            status:
              400,
          }
        );
      }
    ),
};