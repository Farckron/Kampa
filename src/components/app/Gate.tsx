import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { demoCampaign } from "./demo-campaign";
import * as storage from "./storage";
import { MODELS, type ModelId } from "./types";
import { useWizard } from "./WizardContext";

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
    <div className="space-y-4">
      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle>Try the demo</CardTitle>
          <CardDescription>
            See a finished campaign for a Riga coffee shop — no key, no cost.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() =>
              dispatch({ type: "START_DEMO", campaign: demoCampaign })
            }
          >
            View the demo plan
          </Button>
        </CardContent>
      </Card>

      <Card className="[--card-spacing:--spacing(6)]">
        <CardHeader>
          <CardTitle>Use my API key</CardTitle>
          <CardDescription>
            Your key stays in this browser and talks to Anthropic directly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="api-key">Your Anthropic API key</Label>
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
              />
              <p
                id="api-key-help"
                className={
                  showError
                    ? "text-sm text-destructive"
                    : "text-sm text-muted-foreground"
                }
              >
                {showError
                  ? "That doesn't look like a key. Anthropic keys start with sk-ant- and are longer than this."
                  : "Starts with sk-ant-. We never send it anywhere but Anthropic."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remember-key">
                <Checkbox
                  id="remember-key"
                  checked={remember}
                  onCheckedChange={(c) => setRemember(c === true)}
                />
                Remember on this device
              </Label>
              <p className="text-sm text-muted-foreground">
                Stored in this browser only. Otherwise it&rsquo;s gone when the
                tab closes.
              </p>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Model</legend>
              <RadioGroup
                value={state.model}
                onValueChange={(v) =>
                  dispatch({ type: "SET_MODEL", model: v as ModelId })
                }
              >
                {MODELS.map((m) => (
                  <Label
                    key={m.id}
                    htmlFor={m.id}
                    className="items-start gap-3 rounded-xl border border-neutral-200 p-4 font-normal has-data-checked:border-primary dark:border-input"
                  >
                    <RadioGroupItem id={m.id} value={m.id} className="mt-0.5" />
                    <span className="space-y-0.5">
                      <span className="block font-medium">{m.label}</span>
                      <span className="block text-muted-foreground">
                        {m.blurb}
                      </span>
                      <span className="block text-muted-foreground tabular-nums">
                        €{m.inPerMTok}/€{m.outPerMTok} per million tokens
                      </span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </fieldset>

            <Button type="submit" size="lg" disabled={!valid}>
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-1 px-1 text-sm text-muted-foreground">
        <p>
          <a
            className="text-primary underline underline-offset-4"
            href={import.meta.env.BASE_URL + "guide/api-key"}
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
