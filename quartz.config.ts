import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Bor's Blog",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "postHog",
    },
    locale: "en-US",
    baseUrl: "dominicbor.com",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#F4F0E6",
          lightgray: "#E5E5E5",
          gray: "#b8b8b8",
          darkgray: "#000000", // Absolute black for visibility
          dark: "#000000",
          secondary: "#000000",
          tertiary: "#000000",
          highlight: "rgba(0, 0, 0, 0.1)",
        },
        darkMode: {
          light: "#1A1A1A",
          lightgray: "#2A2A2A",
          gray: "#8f8b83",
          darkgray: "#FFFFFF", // Pure white for visibility
          dark: "#FFFFFF",
          secondary: "#FFFFFF",
          tertiary: "#FFFFFF",
          highlight: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest", openLinksInNewTab: true }),
      Plugin.Description(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
