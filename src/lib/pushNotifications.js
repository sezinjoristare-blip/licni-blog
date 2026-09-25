import {
  supabase,
} from "./supabaseClient.js";


const VAPID_PUBLIC_KEY =
  import.meta.env
    .VITE_VAPID_PUBLIC_KEY;


const PUSH_TOPICS_STORAGE_KEY =
  "sergej-push-topics";


const DEFAULT_TOPICS = [
  "all",
];


export const PUSH_TOPIC_OPTIONS = [
  {
    key: "all",
    label: "Све ново",
  },
  {
    key: "board",
    label: "Пано",
  },
  {
    key: "notebook",
    label: "Свеска",
  },
  {
    key: "posters",
    label: "Постери",
  },
  {
    key: "boombox",
    label: "Звучник",
  },
  {
    key: "adventures",
    label: "Догодовштине",
  },
  {
    key: "skate_world",
    label: "Скејт свет",
  },
  {
    key: "quick_wits",
    label: "Брзе доскочице",
  },
];


function normalizeTopics(
  topics
) {
  if (
    !Array.isArray(topics) ||
    topics.length === 0
  ) {
    return DEFAULT_TOPICS;
  }


  if (
    topics.includes("all")
  ) {
    return [
      "all",
    ];
  }


  const allowed =
    new Set(
      PUSH_TOPIC_OPTIONS
        .map(
          (topic) =>
            topic.key
        )
        .filter(
          (topic) =>
            topic !== "all"
        )
    );


  const cleaned =
    [
      ...new Set(
        topics.filter(
          (topic) =>
            allowed.has(topic)
        )
      ),
    ];


  return cleaned.length
    ? cleaned
    : DEFAULT_TOPICS;
}


export function getSavedPushTopics() {
  try {
    const saved =
      localStorage.getItem(
        PUSH_TOPICS_STORAGE_KEY
      );


    if (!saved) {
      return DEFAULT_TOPICS;
    }


    return normalizeTopics(
      JSON.parse(saved)
    );
  } catch {
    return DEFAULT_TOPICS;
  }
}


function savePushTopics(
  topics
) {
  const normalized =
    normalizeTopics(
      topics
    );


  localStorage.setItem(
    PUSH_TOPICS_STORAGE_KEY,
    JSON.stringify(
      normalized
    )
  );


  return normalized;
}


export function isPushSupported() {
  return (
    typeof window !==
      "undefined" &&
    "serviceWorker" in
      navigator &&
    "PushManager" in
      window &&
    "Notification" in
      window
  );
}


function urlBase64ToUint8Array(
  base64String
) {
  const padding =
    "=".repeat(
      (
        4 -
        (
          base64String.length %
          4
        )
      ) %
        4
    );


  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );


  const rawData =
    window.atob(
      base64
    );


  return Uint8Array.from(
    [
      ...rawData,
    ].map(
      (character) =>
        character.charCodeAt(
          0
        )
    )
  );
}


async function getRegistration() {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "Овај прегледач не подржава Web Push."
    );
  }


  return navigator
    .serviceWorker
    .ready;
}


export async function getPushState() {
  if (
    !isPushSupported()
  ) {
    return {
      supported: false,

      permission:
        "unsupported",

      subscribed: false,

      topics:
        getSavedPushTopics(),
    };
  }


  const registration =
    await getRegistration();


  const subscription =
    await registration
      .pushManager
      .getSubscription();


  return {
    supported: true,

    permission:
      Notification.permission,

    subscribed:
      Boolean(
        subscription
      ),

    topics:
      getSavedPushTopics(),
  };
}


async function syncSubscription(
  subscription,
  topics
) {
  const normalizedTopics =
    normalizeTopics(
      topics
    );


  const subscriptionJson =
    subscription.toJSON();


  const {
    error,
  } =
    await supabase
      .functions
      .invoke(
        "push-subscription",
        {
          body: {
            action:
              "upsert",

            subscription:
              subscriptionJson,

            topics:
              normalizedTopics,

            userAgent:
              navigator.userAgent,
          },
        }
      );


  if (error) {
    throw new Error(
      error.message ||
        "Није могуће сачувати push претплату."
    );
  }


  savePushTopics(
    normalizedTopics
  );


  return normalizedTopics;
}


export async function enablePushNotifications(
  topics
) {
  if (
    !isPushSupported()
  ) {
    throw new Error(
      "Овај прегледач не подржава Web Push."
    );
  }


  if (
    Notification.permission ===
    "denied"
  ) {
    throw new Error(
      "Обавештења су блокирана у подешавањима прегледача."
    );
  }


  let permission =
    Notification.permission;


  if (
    permission !==
    "granted"
  ) {
    permission =
      await Notification
        .requestPermission();
  }


  if (
    permission !==
    "granted"
  ) {
    return {
      enabled: false,
      permission,
    };
  }


  if (
    !VAPID_PUBLIC_KEY
  ) {
    throw new Error(
      "Недостаје VITE_VAPID_PUBLIC_KEY."
    );
  }


  const registration =
    await getRegistration();


  let subscription =
    await registration
      .pushManager
      .getSubscription();


  if (!subscription) {
    subscription =
      await registration
        .pushManager
        .subscribe({
          userVisibleOnly:
            true,

          applicationServerKey:
            urlBase64ToUint8Array(
              VAPID_PUBLIC_KEY
            ),
        });
  }


  const savedTopics =
    await syncSubscription(
      subscription,
      topics
    );


  return {
    enabled: true,
    permission,
    subscription,
    topics:
      savedTopics,
  };
}


export async function updatePushTopics(
  topics
) {
  const registration =
    await getRegistration();


  const subscription =
    await registration
      .pushManager
      .getSubscription();


  if (!subscription) {
    return enablePushNotifications(
      topics
    );
  }


  const savedTopics =
    await syncSubscription(
      subscription,
      topics
    );


  return {
    enabled: true,

    permission:
      Notification.permission,

    subscription,

    topics:
      savedTopics,
  };
}


export async function disablePushNotifications() {
  if (
    !isPushSupported()
  ) {
    return;
  }


  const registration =
    await getRegistration();


  const subscription =
    await registration
      .pushManager
      .getSubscription();


  if (!subscription) {
    localStorage.removeItem(
      PUSH_TOPICS_STORAGE_KEY
    );

    return;
  }


  try {
    await supabase
      .functions
      .invoke(
        "push-subscription",
        {
          body: {
            action:
              "remove",

            endpoint:
              subscription.endpoint,
          },
        }
      );
  } catch (error) {
    console.warn(
      "Subscription nije obrisan iz baze:",
      error
    );
  }


  await subscription
    .unsubscribe();


  localStorage.removeItem(
    PUSH_TOPICS_STORAGE_KEY
  );
}