import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";


const AdminDraftContext =
  createContext(
    null
  );


const INITIAL_STATE = {
  status:
    "idle",

  message:
    "",

  scope:
    "",

  updatedAt:
    null,
};


export function AdminDraftProvider({
  children,
}) {
  const [
    state,
    setState,
  ] = useState(
    INITIAL_STATE
  );


  const reportStatus =
    useCallback(
      (
        status,
        options = {}
      ) => {
        setState({
          status,

          message:
            options.message ||
            "",

          scope:
            options.scope ||
            "",

          updatedAt:
            options.updatedAt ||
            new Date()
              .toISOString(),
        });
      },
      []
    );


  const resetStatus =
    useCallback(
      () => {
        setState(
          INITIAL_STATE
        );
      },
      []
    );


  const value =
    useMemo(
      () => ({
        ...state,

        reportStatus,

        resetStatus,
      }),
      [
        state,
        reportStatus,
        resetStatus,
      ]
    );


  return (
    <AdminDraftContext.Provider
      value={value}
    >
      {children}
    </AdminDraftContext.Provider>
  );
}


export function useAdminDraftStatus() {
  const context =
    useContext(
      AdminDraftContext
    );


  if (!context) {
    throw new Error(
      "useAdminDraftStatus mora biti korišćen unutar AdminDraftProvider."
    );
  }


  return context;
}