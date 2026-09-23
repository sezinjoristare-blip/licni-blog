import {
  useAdminDraftStatus,
} from "../../admin-safety/AdminDraftContext";

import "../../styles/admin/AdminSaveStatus.css";


const STATUS_LABELS = {
  idle:
    "СПРЕМНО",

  dirty:
    "ИЗМЕНЕ...",

  saving:
    "ЧУВАЊЕ...",

  local:
    "ЛОКАЛНО САЧУВАНО",

  saved:
    "САЧУВАНО",

  error:
    "ГРЕШКА",

  attention:
    "ПОТРЕБНА ПАЖЊА",
};


function formatTime(
  value
) {
  if (!value) {
    return "";
  }


  try {
    return new Intl
      .DateTimeFormat(
        "sr-RS",
        {
          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      )
      .format(
        new Date(
          value
        )
      );

  } catch {
    return "";
  }
}


function AdminSaveStatus() {
  const {
    status,
    message,
    updatedAt,
  } =
    useAdminDraftStatus();


  const label =
    STATUS_LABELS[
      status
    ] ||
    STATUS_LABELS.idle;


  const time =
    formatTime(
      updatedAt
    );


  return (
    <div
      className={
        `admin-save-status admin-save-status--${status}`
      }
      title={
        message ||
        label
      }
    >
      <span
        className="admin-save-status__dot"
        aria-hidden="true"
      />

      <span className="admin-save-status__label">
        {label}
      </span>

      {time &&
      status !==
        "dirty" &&
      status !==
        "saving" ? (
        <time className="admin-save-status__time">
          {time}
        </time>
      ) : null}
    </div>
  );
}


export default AdminSaveStatus;