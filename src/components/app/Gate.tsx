import * as React from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { demoCampaign } from "./demo-campaign";
import * as storage from "./storage";
import { MODELS, type ModelId } from "./types";
import { useWizard } from "./WizardContext";

const base = import.meta.env.BASE_URL;

const keyValid = (k: string) => k.startsWith("sk-ant-") && k.length > 20;

export function Gate() {
  const { state, dispatch } = useWizard();
  const [key, setKey] = React.useState("");
  const [remember, setRemember] = React.useState(false);

  const valid = keyValid(key);
  const showError = key.length > 0 && !valid;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    storage.setKey(key, remember);
    dispatch({ type: "KEY_SET" });
    dispatch({ type: "START_INTAKE" });
  }

  return (
    <div>
      <div className="mb-9 text-center">
        <img
          src={base + "favicon.svg"}
          width="40"
          height="40"
          alt=""
          className="mx-auto mb-5 block"
        />
        <h2 className="text-[length:var(--text-h2)] leading-[var(--lh-h2)]">
          Start a campaign
        </h2>
        <p className="mx-auto mt-3.5 max-w-[42ch] text-[length:var(--text-lead)] text-ink-soft">
          No signup. No servers. Your data and API key never leave your browser.
        </p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-5 px-7 py-[26px]">
        <div>
          <h3 className="text-[length:var(--text-h3)]">Try the demo</h3>
          <p className="mt-1.5 text-[length:var(--text-sm)] text-ink-soft">
            See a finished campaign for a Riga coffee shop — no key, no cost.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() =>
            dispatch({ type: "START_DEMO", campaign: demoCampaign })
          }
        >
          View the demo plan <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="divider-or">or</div>

      <form onSubmit={submit} className="card px-7 py-[26px]">
        <h3 className="text-[length:var(--text-h3)]">Use my API key</h3>
        <p className="mt-1.5 text-[length:var(--text-sm)] text-ink-soft">
          Your key stays in this browser and talks to Anthropic directly.
        </p>

        <div className="mt-6">
          <Label
            htmlFor="api-key"
            className="mb-2 text-[0.78125rem] font-semibold text-ink-soft"
          >
            Your Anthropic API key
          </Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk-ant-..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
            aria-invalid={showError || undefined}
            aria-describedby="api-key-help"
            className="bg-paper-dim font-mono text-[0.84375rem] focus:bg-card"
          />
          <p
            id="api-key-help"
            className={
              showError
                ? "mt-2 text-[length:var(--text-xs)] text-destructive"
                : "mt-2 text-[length:var(--text-xs)] text-ink-soft"
            }
          >
            {showError
              ? "That doesn't look like a key. Anthropic keys start with sk-ant- and are longer than this."
              : "Starts with sk-ant-. We never send it anywhere but Anthropic."}
          </p>
        </div>

        <Label
          htmlFor="remember-key"
          className="mt-4 min-h-11 gap-2.5 text-[0.84375rem] font-normal"
        >
          <Checkbox
            id="remember-key"
            checked={remember}
            onCheckedChange={(c) => setRemember(c === true)}
            aria-describedby="remember-key-help"
          />
          Remember on this device
        </Label>
        <p id="remember-key-help" className="callout mt-2.5">
          Stored in this browser only. Otherwise it&rsquo;s gone when the tab
          closes.
        </p>

        <fieldset className="mt-6">
          <legend className="mb-2 text-[0.78125rem] font-semibold text-ink-soft">
            Model
          </legend>
          <RadioGroup
            value={state.model}
            onValueChange={(v) =>
              dispatch({ type: "SET_MODEL", model: v as ModelId })
            }
            className="gap-2.5"
          >
            {MODELS.map((m) => (
              <Label
                key={m.id}
                htmlFor={m.id}
                className="cursor-pointer items-start gap-3 rounded-[var(--radius-input)] border border-line px-[18px] py-4 font-normal has-data-checked:border-violet has-data-checked:bg-[color-mix(in_oklab,var(--violet)_5%,transparent)]"
              >
                <RadioGroupItem id={m.id} value={m.id} className="mt-1" />
                <span className="flex-1">
                  <span className="block text-[0.90625rem] font-semibold">
                    {m.label}
                  </span>
                  <span className="mt-0.5 block text-[length:var(--text-xs)] text-ink-soft">
                    {m.blurb}
                  </span>
                  <span className="mt-1 block font-mono text-[length:var(--text-xs)] text-ink-soft tabular-nums">
                    €{m.inPerMTok}/€{m.outPerMTok} per million tokens
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </fieldset>

        <button
          type="submit"
          className="btn btn-grad mt-6 w-full"
          disabled={!valid}
        >
          Continue <span aria-hidden="true">→</span>
        </button>
      </form>

      <div className="mt-5 space-y-1.5 px-1 text-[length:var(--text-sm)] text-ink-soft">
        <p>
          <a
            className="font-semibold text-violet-ink underline underline-offset-4"
            href={base + "guide/api-key"}
          >
            How do I get a key? (90-second guide)
          </a>
        </p>
        <p>
          Tip: create a dedicated key with a monthly spend limit. A full
          campaign costs about €1.
        </p>
      </div>
    </div>
  );
}
