import { createCn } from "cn/config";

/**
 * `cn` yang mengenal skala tipografi DesaNyala (lihat globals.css).
 * Tanpa ini, `text-body-strong` dkk. dianggap utility warna sehingga
 * `cn("text-body-strong", "text-brand")` membuang salah satunya.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "h1",
            "h2",
            "h3",
            "body",
            "body-strong",
            "small",
            "label",
            "label-meta",
            "kpi",
            "value",
            "num-sm",
            "code",
          ],
        },
      ],
    },
  },
});
