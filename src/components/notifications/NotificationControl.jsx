import {
  useEffect,
  useState,
} from "react";

import {
  disablePushNotifications,
  enablePushNotifications,
  getPushState,
  PUSH_TOPIC_OPTIONS,
  updatePushTopics,
} from "../../lib/pushNotifications";

import "./NotificationControl.css";


function NotificationBellIcon() {
  return (
    <svg
      className="push-notifications__bell-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="
          M18 8
          A6 6 0 0 0 6 8
          C6 14 3 15 3 17
          H21
          C21 15 18 14 18 8
          Z
        "
      />

      <path
        d="
          M9.7 20
          C10.2 21.2 11 21.8 12 21.8
          C13 21.8 13.8 21.2 14.3 20
        "
      />
    </svg>
  );
}


function NotificationControl() {
  const [
    open,
    setOpen,
  ] = useState(false);


  const [
    working,
    setWorking,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    pushState,
    setPushState,
  ] = useState({
    supported: true,

    permission:
      "default",

    subscribed:
      false,

    topics: [
      "all",
    ],
  });


  async function refreshState() {
    try {
      const nextState =
        await getPushState();

      setPushState(
        nextState
      );
    } catch (error) {
      console.error(
        error
      );
    }
  }


  useEffect(
    () => {
      refreshState();
    },
    []
  );


  function toggleTopic(
    topicKey
  ) {
    setPushState(
      (current) => {
        const currentTopics =
          current.topics ||
          [
            "all",
          ];


        if (
          topicKey ===
          "all"
        ) {
          return {
            ...current,

            topics: [
              "all",
            ],
          };
        }


        const withoutAll =
          currentTopics.filter(
            (topic) =>
              topic !==
              "all"
          );


        const alreadySelected =
          withoutAll.includes(
            topicKey
          );


        let nextTopics =
          alreadySelected
            ? withoutAll.filter(
                (topic) =>
                  topic !==
                  topicKey
              )
            : [
                ...withoutAll,
                topicKey,
              ];


        if (
          nextTopics.length ===
          0
        ) {
          nextTopics = [
            "all",
          ];
        }


        return {
          ...current,
          topics:
            nextTopics,
        };
      }
    );
  }


  async function handleEnable() {
    setWorking(true);
    setMessage("");


    try {
      const result =
        await enablePushNotifications(
          pushState.topics
        );


      if (
        !result.enabled
      ) {
        setMessage(
          "Обавештења нису укључена."
        );
      } else {
        setMessage(
          "Обавештења су укључена."
        );
      }


      await refreshState();
    } catch (error) {
      setMessage(
        error.message ||
          "Није могуће укључити обавештења."
      );
    } finally {
      setWorking(false);
    }
  }


  async function handleSave() {
    setWorking(true);
    setMessage("");


    try {
      await updatePushTopics(
        pushState.topics
      );


      setMessage(
        "Избор је сачуван."
      );


      await refreshState();
    } catch (error) {
      setMessage(
        error.message ||
          "Није могуће сачувати избор."
      );
    } finally {
      setWorking(false);
    }
  }


  async function handleDisable() {
    setWorking(true);
    setMessage("");


    try {
      await disablePushNotifications();


      setMessage(
        "Обавештења су искључена."
      );


      await refreshState();
    } catch (error) {
      setMessage(
        error.message ||
          "Није могуће искључити обавештења."
      );
    } finally {
      setWorking(false);
    }
  }


  if (
    !pushState.supported
  ) {
    return null;
  }


  const permissionDenied =
    pushState.permission ===
    "denied";


  return (
    <div className="push-notifications">
      <button
        type="button"
        className={
          pushState.subscribed
            ? "push-notifications__trigger push-notifications__trigger--active"
            : "push-notifications__trigger"
        }
        onClick={
          () =>
            setOpen(
              (current) =>
                !current
            )
        }
        aria-expanded={
          open
        }
        aria-label="Обавештења"
        title="Обавештења"
      >
        <NotificationBellIcon />

        {pushState.subscribed && (
          <span
            className="push-notifications__active-dot"
            aria-hidden="true"
          />
        )}
      </button>


      {open && (
        <section
          className="push-notifications__panel"
          aria-label="Подешавања обавештења"
        >
          <div className="push-notifications__heading">
            <strong>
              ОБАВЕШТЕЊА
            </strong>

            <button
              type="button"
              className="push-notifications__close"
              onClick={
                () =>
                  setOpen(false)
              }
              aria-label="Затвори"
            >
              ×
            </button>
          </div>


          <p className="push-notifications__intro">
            Изабери шта желиш
            да ти јавим када се
            појави нешто ново.
          </p>


          <div className="push-notifications__topics">
            {PUSH_TOPIC_OPTIONS.map(
              (topic) => (
                <label
                  key={
                    topic.key
                  }
                  className="push-notifications__topic"
                >
                  <input
                    type="checkbox"
                    checked={
                      pushState
                        .topics
                        .includes(
                          topic.key
                        )
                    }
                    onChange={
                      () =>
                        toggleTopic(
                          topic.key
                        )
                    }
                  />

                  <span>
                    {topic.label}
                  </span>
                </label>
              )
            )}
          </div>


          {permissionDenied && (
            <p className="push-notifications__warning">
              Обавештења су
              блокирана у
              подешавањима
              прегледача.
            </p>
          )}


          {!pushState.subscribed ? (
            <button
              type="button"
              className="push-notifications__action"
              onClick={
                handleEnable
              }
              disabled={
                working ||
                permissionDenied
              }
            >
              {working
                ? "УКЉУЧУЈЕМ..."
                : "УКЉУЧИ ОБАВЕШТЕЊА"}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="push-notifications__action"
                onClick={
                  handleSave
                }
                disabled={
                  working
                }
              >
                {working
                  ? "ЧУВАМ..."
                  : "САЧУВАЈ ИЗБОР"}
              </button>

              <button
                type="button"
                className="push-notifications__disable"
                onClick={
                  handleDisable
                }
                disabled={
                  working
                }
              >
                ИСКЉУЧИ
              </button>
            </>
          )}


          {message && (
            <p className="push-notifications__message">
              {message}
            </p>
          )}
        </section>
      )}
    </div>
  );
}


export default NotificationControl;