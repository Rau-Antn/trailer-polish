import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Мир прицепов Омск — легковые прицепы в наличии" },
      {
        name: "description",
        content:
          "Продажа легковых прицепов в Омске: бортовые и специализированные модели. Горячее цинкование, гарантия, доставка. Звоните: 8-913-147-4624.",
      },
      { "http-equiv": "refresh", content: "0; url=/index.html" },
    ],
    links: [{ rel: "canonical", href: "/index.html" }],
  }),
});

function Index() {
  useEffect(() => {
    window.location.replace("/index.html");
  }, []);
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0b1017",
        color: "#cfe6ff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <noscript>
        <a href="/index.html" style={{ color: "#82d8ff" }}>
          Перейти на сайт →
        </a>
      </noscript>
      Загрузка…
    </div>
  );
}
