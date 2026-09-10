import { AppConfig } from "@/utils/system";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { ImageResponse } = await import("takumi-js/response");
        const { googleFonts } = await import("takumi-js/helpers");

        const url = new URL(request.url);
        const title = url.searchParams.get("title") ?? AppConfig.name;
        const description = url.searchParams.get("description") ?? AppConfig.description;

        const response = new ImageResponse(
          (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "72px",
                background: "#171612",
                color: "#e8e2d4",
                fontFamily: "Space Grotesk",
              }}
            >
              <p style={{ fontSize: 24, letterSpacing: "0.28em", textTransform: "uppercase", opacity: 0.6 }}>
                tigawanna
              </p>
              <h1 style={{ fontSize: 72, lineHeight: 1.05, marginTop: 24, maxWidth: 900 }}>{title}</h1>
              <p style={{ fontSize: 30, lineHeight: 1.5, marginTop: 24, maxWidth: 900, opacity: 0.75 }}>
                {description}
              </p>
            </div>
          ),
          {
            width: 1200,
            height: 630,
            fonts: googleFonts([{ name: "Space Grotesk", weight: [400, 500, 600] }]),
            headers: {
              "Cache-Control": "public, max-age=86400, s-maxage=604800",
              "Access-Control-Allow-Origin": "*",
              "Cross-Origin-Resource-Policy": "cross-origin",
            },
          },
        );

        try {
          await response.ready;
          return response;
        } catch {
          return new Response("Failed to generate OG image", { status: 500 });
        }
      },
    },
  },
});
