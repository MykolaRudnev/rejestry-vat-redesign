import { createCn } from "cn/config";

/** Class merger that knows Saldo's custom scales, so `text-body` and `text-ink-1` don't collide. */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["hero", "display-1", "display-2", "display-3", "title", "body", "small", "micro", "mono"] }],
      rounded: [{ rounded: ["pill"] }],
      shadow: [{ shadow: ["sheet", "raised", "overlay", "fab"] }],
    },
  },
});
