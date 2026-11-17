// Unit tests for edge-function helpers. No network or stack needed:
//   cd supabase/functions && deno test _tests/
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  calculateTrialEndUnixTimestamp,
  toDateTime,
} from "../_shared/utils.ts";

Deno.test("E1 toDateTime converts Stripe unix seconds to a Date", () => {
  assertEquals(toDateTime(0).toISOString(), "1970-01-01T00:00:00.000Z");
  assertEquals(
    toDateTime(1_794_960_000).toISOString(),
    new Date(1_794_960_000 * 1000).toISOString(),
  );
});

Deno.test("E2 no trial for null/undefined/<2 days", () => {
  for (const d of [null, undefined, 0, 1]) {
    assertEquals(calculateTrialEndUnixTimestamp(d), undefined);
  }
});

Deno.test("E3 trial end is (days + 1) from now, in seconds", () => {
  const before = Math.floor(Date.now() / 1000);
  const end = calculateTrialEndUnixTimestamp(7)!;
  const after = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  assert(end >= before + 8 * day && end <= after + 8 * day);
});
