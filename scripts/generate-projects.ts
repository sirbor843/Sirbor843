import { mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"

type Repo = {
  name: string
  html_url: string
  description: string | null
  language: string | null
  fork: boolean
  archived: boolean
  disabled: boolean
  updated_at: string
}

type ProjectDetails = {
  summary: string
  stack: string
  features: string
  focus: string
}

const curatedDetails: Record<string, ProjectDetails> = {
  KDInsight: {
    summary: "A fintech solutions and research platform focused on practical digital products for African markets.",
    stack: "TypeScript",
    features: "Modular frontend architecture, reusable UI components, and product-focused fintech workflows.",
    focus: "Research-driven product exploration, usability, and scalable web foundations.",
  },
  Jikoni: {
    summary:
      "A modern iOS restaurant and food discovery app that blends recipe browsing, booking flows, and location-aware experiences.",
    stack: "Swift, SwiftUI, MapKit, Clean Architecture",
    features: "Restaurant discovery, booking flow, structured app layers, and map-powered location views.",
    focus: "iOS UI polish, maintainable architecture, and mobile commerce UX.",
  },
  Kitchen: {
    summary: "A Kotlin-based Android app for restaurant discovery, menu exploration, and appointment-style booking experiences.",
    stack: "Kotlin, Android",
    features: "Menu and recipe browsing, booking workflows, and Android-first UI implementation.",
    focus: "Android fundamentals, app navigation patterns, and clean mobile user journeys.",
  },
  Dukani: {
    summary: "A Django-powered e-commerce platform for managing and selling products such as books and clothing.",
    stack: "Python, Django",
    features: "Product listing flows, category-driven catalog structure, and core commerce foundations.",
    focus: "Backend web development, data modeling, and practical storefront logic.",
  },
  Commandline_Calculator: {
    summary: "A C-based command-line scientific calculator focused on performance, reliability, and low-level programming fundamentals.",
    stack: "C",
    features: "Arithmetic and scientific operations, terminal-based interaction, and modular C implementation.",
    focus: "Systems programming concepts, memory-safe patterns, and CLI tool design.",
  },
  "Bus-Reservation-System": {
    summary: "A C++ console application for managing bus records and reserving seats based on availability.",
    stack: "C++",
    features: "Bus detail management, seat allocation tracking, and reservation handling via CLI.",
    focus: "Object-oriented programming in C++, control flow, and command-line user flows.",
  },
  Kibeti: {
    summary: "A fintech-style iOS app inspired by M-PESA workflows for learning digital wallet UX and mobile transaction patterns.",
    stack: "Swift",
    features: "Wallet-style navigation patterns, transaction-oriented interfaces, and mobile fintech UI practice.",
    focus: "Swift development, app structure, and finance-oriented interaction design.",
  },
}

const preferredFeaturedOrder = [
  "KDInsight",
  "Jikoni",
  "Kitchen",
  "Dukani",
  "Commandline_Calculator",
  "Bus-Reservation-System",
  "Kibeti",
]

function toTitle(name: string): string {
  return name.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
}

function inferDetails(repo: Repo): ProjectDetails {
  const summary = repo.description?.trim() || `${toTitle(repo.name)} project from my GitHub profile.`
  const stack = repo.language?.trim() || "Not specified"
  return {
    summary,
    stack,
    features: "Repository-driven implementation with practical workflows and iterative improvements.",
    focus: "Hands-on software development and continuous technical growth.",
  }
}

function formatProjectHeading(repo: Repo, noteNames: Set<string>): string {
  if (noteNames.has(repo.name)) {
    return `#### **[[${repo.name}]]**`
  }

  return `#### **[${repo.name}](${repo.html_url})**`
}

async function getRepos(username: string, token?: string): Promise<Repo[]> {
  const url = `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sirbor-projects-generator",
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { headers })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}\n${body}`)
  }

  return (await response.json()) as Repo[]
}

async function run() {
  const root = process.cwd()
  const projectsDir = path.join(root, "content", "projects")
  const outputPath = path.join(projectsDir, "index.md")
  const username = process.env.GITHUB_USERNAME || "sirbor"
  const token = process.env.GITHUB_TOKEN

  await mkdir(projectsDir, { recursive: true })

  const noteFiles = await readdir(projectsDir)
  const noteNames = new Set(
    noteFiles
      .filter((name) => name.endsWith(".md"))
      .map((name) => name.replace(/\.md$/, ""))
      .filter((name) => name !== "index"),
  )

  const repos = await getRepos(username, token)
  const eligible = repos
    .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  const featured: Repo[] = []
  for (const name of preferredFeaturedOrder) {
    const match = eligible.find((repo) => repo.name === name)
    if (match) featured.push(match)
  }

  const fallbackFeatured = eligible.filter((repo) => !featured.some((item) => item.name === repo.name)).slice(0, 7 - featured.length)
  featured.push(...fallbackFeatured)

  const others = eligible.filter((repo) => !featured.some((item) => item.name === repo.name)).slice(0, 8)

  const lines: string[] = []
  lines.push("---")
  lines.push("title: Projects")
  lines.push("---")
  lines.push("")
  lines.push("A showcase of my recent work, sourced from my GitHub repositories and refreshed automatically at build time.")
  lines.push("")
  lines.push("### Featured Projects")
  lines.push("")

  for (const repo of featured) {
    const details = curatedDetails[repo.name] || inferDetails(repo)
    lines.push(formatProjectHeading(repo, noteNames))
    lines.push(details.summary)
    lines.push(`- **Tech Stack:** ${details.stack}`)
    lines.push(`- **Key Features:** ${details.features}`)
    lines.push(`- **Focus Areas:** ${details.focus}`)
    lines.push(`- **Source:** [GitHub](${repo.html_url})`)
    lines.push("")
  }

  lines.push("---")
  lines.push("")
  lines.push("### Other Projects")
  for (const repo of others) {
    const summary = repo.description?.trim() || "Repository showcasing practical implementation work."
    if (noteNames.has(repo.name)) {
      lines.push(`- **[[${repo.name}]]**: ${summary}`)
    } else {
      lines.push(`- **[${repo.name}](${repo.html_url})**: ${summary}`)
    }
  }

  lines.push("")
  lines.push(`_Last synced from GitHub: ${new Date().toISOString()}_`)
  lines.push("")

  await writeFile(outputPath, lines.join("\n"), "utf8")
  console.log(`Generated ${path.relative(root, outputPath)} from @${username} repositories.`)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
