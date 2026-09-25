self.addEventListener(
  "install",
  () => {
    self.skipWaiting();
  }
);


self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim()
    );
  }
);


self.addEventListener(
  "push",
  (event) => {
    let payload = {
      title:
        "Ново на сајту",

      body:
        "Објављен је нови садржај.",

      url:
        "/",
    };


    if (event.data) {
      try {
        payload = {
          ...payload,
          ...event.data.json(),
        };
      } catch {
        payload = {
          ...payload,
          body:
            event.data.text(),
        };
      }
    }


    event.waitUntil(
      self.registration
        .showNotification(
          payload.title,
          {
            body:
              payload.body,

            tag:
              payload.tag ||
              undefined,

            data: {
              url:
                payload.url ||
                "/",
            },
          }
        )
    );
  }
);


self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification
      .close();


    const targetUrl =
      new URL(
        event.notification
          .data?.url ||
          "/",
        self.location.origin
      ).href;


    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled:
            true,
        })
        .then(
          async (
            clientList
          ) => {
            for (
              const client
              of clientList
            ) {
              if (
                "focus" in
                client
              ) {
                try {
                  await client
                    .navigate(
                      targetUrl
                    );
                } catch {
                  // Ako navigate nije moguć,
                  // otvorićemo novi prozor.
                }

                return client
                  .focus();
              }
            }


            if (
              self.clients
                .openWindow
            ) {
              return self.clients
                .openWindow(
                  targetUrl
                );
            }


            return undefined;
          }
        )
    );
  }
);