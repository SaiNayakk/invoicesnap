"use client";

import PocketBase from "pocketbase";

let _pb: PocketBase | null = null;

/** Browser-only singleton. Never use in API routes or middleware. */
export function getPB(): PocketBase {
  if (!_pb) {
    _pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
  }
  return _pb;
}
