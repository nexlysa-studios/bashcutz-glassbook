import { useEffect } from "react";

type JsonLd = Record<string, unknown> | Record<string, unknown>[];

type SEOOptions = {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  path?: string;
  type?: "website" | "article";
  robots?: string;
  structuredData?: JsonLd;
};

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector(
    'link[rel="canonical"]'
  ) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const upsertStructuredData = (structuredData?: JsonLd) => {
  const id = "seo-structured-data";
  const existing = document.getElementById(id);

  if (!structuredData) {
    existing?.remove();
    return;
  }

  const script =
    existing ||
    Object.assign(document.createElement("script"), {
      id,
      type: "application/ld+json",
    });

  script.textContent = JSON.stringify(structuredData);
  if (!existing) document.head.appendChild(script);
};

export const useSEO = ({
  title,
  description,
  keywords,
  image = "/Bashcutz-logo-removebg-preview.png",
  path,
  type = "website",
  robots = "index, follow",
  structuredData,
}: SEOOptions) => {
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const currentPath = path ?? window.location.pathname;
    const url = new URL(currentPath, baseUrl).toString();
    const imageUrl = new URL(image, baseUrl).toString();

    document.title = title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    upsertMeta('meta[name="keywords"]', {
      name: "keywords",
      content:
        keywords ||
        "barbershop, barber, haircuts, beard trim, fades, grooming, barber near me",
    });
    upsertMeta('meta[name="robots"]', { name: "robots", content: robots });

    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: imageUrl,
    });

    upsertMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: imageUrl,
    });

    upsertCanonical(url);
    upsertStructuredData(structuredData);
  }, [title, description, keywords, image, path, type, robots, structuredData]);
};
