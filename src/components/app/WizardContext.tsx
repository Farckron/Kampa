import * as React from "react";

import { reducer } from "./reducer";
import { initialState, type Action, type WizardState } from "./types";

type WizardValue = { state: WizardState; dispatch: React.Dispatch<Action> };

const WizardCtx = React.createContext<WizardValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const value = React.useMemo<WizardValue>(
    () => ({ state, dispatch }),
    [state],
  );
  return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

export function useWizard(): WizardValue {
  const ctx = React.useContext(WizardCtx);
  if (ctx === null)
    throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
