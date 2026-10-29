import fs from "fs";
import path from "path";
import db from "@/lib/db";

export interface RenderCardOptions {
  templateCode: "THE_COURTROOM" | "UNPOPULAR_OPINION" | "AURA_TAX" | "TWO_SIDES" | "MULTI_SLIDE_CAROUSEL";
  caseNumber?: string;
  pillar?: string;
  headline: string;
  narrative?: string;
  options?: Array<{ key: string; label: string }>;
  auraPoints?: number;
  sideA?: { title: string; argument: string };
  sideB?: { title: string; argument: string };
  slideIndex?: number;
  slideTotal?: number;
  slideType?: string;
  stampText?: string;
  brandName?: string;
  handle?: string;
  chatContactName?: string;
  chatMessages?: Array<{ sender: "ME" | "THEM"; text: string; time?: string }>;
  swipeCtaText?: string;
}

// 1080 x 1350 px standard Instagram 4:5 Feed Canvas
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1350;

// Escape XML entities for safe SVG text nodes
function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Word-wrap utility for SVG multi-line text blocks
function wrapText(text: string, maxCharsPerLine: number = 34): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export class CreativeRendererService {
  // Render Template 1: THE COURTROOM Flagship
  public static renderCourtroomSVG(opts: RenderCardOptions): string {
    const caseNum = opts.caseNumber || "CASE #104";
    const pillarTag = opts.pillar?.replace(/_/g, " ") || "RELATIONSHIPS";
    const stamp = opts.stampText || "VERDICT PENDING";
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const headlineLines = wrapText(opts.headline, 28);
    const narrativeLines = wrapText(opts.narrative || "", 44);

    const options = opts.options || [
      { key: "A", label: "Fair — Equal contribution protects dignity" },
      { key: "B", label: "Unfair — Split proportionally based on income" },
      { key: "C", label: "Red Flag — Insensitive to partner's finances" },
      { key: "D", label: "Switch to dates both can afford easily" },
    ];

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B0C10"/>
          <stop offset="50%" stop-color="#10121A"/>
          <stop offset="100%" stop-color="#08090C"/>
        </linearGradient>
        <linearGradient id="crimsonGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#DC2626"/>
          <stop offset="100%" stop-color="#991B1B"/>
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#1E2333" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#08090C" stop-opacity="0.95"/>
        </radialGradient>
        <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
        <filter id="crimsonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="glow"/>
          <feComposite in="SourceGraphic" in2="glow" operator="over"/>
        </filter>
      </defs>

      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>

      <!-- Canvas Background with Vignette -->
      <rect width="1080" height="1350" fill="url(#bgGrad)"/>
      <rect width="1080" height="1350" fill="url(#vignette)"/>

      <!-- Outer Frame & Grid Accents -->
      <rect x="40" y="40" width="1000" height="1270" fill="none" stroke="#222838" stroke-width="1.5"/>
      <rect x="52" y="52" width="976" height="1246" fill="none" stroke="#161A26" stroke-width="1"/>

      <!-- Corner Marks -->
      <path d="M 40 70 L 40 40 L 70 40" fill="none" stroke="#DC2626" stroke-width="3"/>
      <path d="M 1040 70 L 1040 40 L 1010 40" fill="none" stroke="#DC2626" stroke-width="3"/>
      <path d="M 40 1280 L 40 1310 L 70 1310" fill="none" stroke="#DC2626" stroke-width="3"/>
      <path d="M 1040 1280 L 1040 1310 L 1010 1310" fill="none" stroke="#DC2626" stroke-width="3"/>

      <!-- Header Section -->
      <g transform="translate(80, 110)">
        <!-- Case Pill Badge -->
        <rect x="0" y="0" width="180" height="42" rx="4" fill="#1C1F2E" stroke="#2D334A" stroke-width="1"/>
        <text x="90" y="26" fill="#F87171" font-size="16" text-anchor="middle" class="mono" font-weight="700">${escapeXml(caseNum)}</text>

        <!-- Category Pill Badge -->
        <rect x="195" y="0" width="220" height="42" rx="4" fill="#151722" stroke="#222636" stroke-width="1"/>
        <text x="305" y="26" fill="#94A3B8" font-size="15" text-anchor="middle" class="sans" font-weight="600">${escapeXml(pillarTag)}</text>

        <!-- Brand Identifier -->
        <text x="920" y="26" fill="#E2E8F0" font-size="16" text-anchor="end" class="serif" letter-spacing="1">${escapeXml(brandName)}</text>
      </g>

      <!-- Headline Section -->
      <g transform="translate(80, 230)">
        ${headlineLines
          .map(
            (line, idx) =>
              `<text x="0" y="${idx * 68}" fill="#FFFFFF" font-size="52" class="serif" letter-spacing="-0.5">${escapeXml(line)}</text>`
          )
          .join("\n")}
      </g>

      <!-- Crimson Divider Accent Line -->
      <line x1="80" y1="470" x2="240" y2="470" stroke="#DC2626" stroke-width="4"/>
      <line x1="250" y1="470" x2="1000" y2="470" stroke="#23283B" stroke-width="1"/>

      <!-- Editorial Narrative Box -->
      <g transform="translate(80, 510)">
        <rect x="0" y="0" width="920" height="150" rx="8" fill="#131622" stroke="#23283B" stroke-width="1" filter="url(#cardShadow)"/>
        <!-- Gavel / Scale Icon Placeholder Accent -->
        <rect x="0" y="0" width="6" height="150" rx="2" fill="#DC2626"/>
        <g transform="translate(36, 44)">
          ${narrativeLines
            .slice(0, 3)
            .map(
              (line, idx) =>
                `<text x="0" y="${idx * 34}" fill="#CBD5E1" font-size="23" class="sans" font-weight="400">${escapeXml(line)}</text>`
            )
            .join("\n")}
        </g>
      </g>

      <!-- 4 Verdict Options (Courtroom Jury Choices) -->
      <g transform="translate(80, 710)">
        <text x="0" y="0" fill="#94A3B8" font-size="16" class="mono" font-weight="700">POSSIBLE VERDICTS (CHOOSE A, B, C, OR D):</text>

        ${options
          .slice(0, 4)
          .map((opt, i) => {
            const y = 30 + i * 94;
            return `
            <g transform="translate(0, ${y})">
              <rect x="0" y="0" width="920" height="74" rx="8" fill="#141724" stroke="#272D40" stroke-width="1.2"/>
              <rect x="14" y="14" width="46" height="46" rx="6" fill="#1F2436" stroke="#DC2626" stroke-width="1.2"/>
              <text x="37" y="44" fill="#FFFFFF" font-size="22" font-weight="700" text-anchor="middle" class="serif">${opt.key}</text>
              <text x="80" y="45" fill="#E2E8F0" font-size="22" class="sans" font-weight="500">${escapeXml(opt.label)}</text>
            </g>`;
          })
          .join("\n")}
      </g>

      <!-- Diagonal Crimson Verdict Stamp -->
      <g transform="translate(820, 480) rotate(-14)">
        <rect x="-140" y="-35" width="280" height="70" rx="6" fill="none" stroke="#EF4444" stroke-width="3" stroke-dasharray="10 4" opacity="0.85"/>
        <text x="0" y="10" fill="#EF4444" font-size="24" font-weight="900" text-anchor="middle" class="mono" opacity="0.9" letter-spacing="3">${escapeXml(stamp)}</text>
      </g>

      <!-- Branded Footer -->
      <g transform="translate(80, 1220)">
        <line x1="0" y1="0" x2="920" y2="0" stroke="#1F2436" stroke-width="1"/>
        <text x="0" y="38" fill="#94A3B8" font-size="18" class="sans" font-weight="600">THE INTERNET IS THE JURY.</text>
        <text x="0" y="62" fill="#64748B" font-size="15" class="sans">Defend your position in the comments</text>
        <text x="920" y="44" fill="#F87171" font-size="18" text-anchor="end" class="mono" font-weight="700">${escapeXml(handle)}</text>
      </g>
    </svg>`;
  }

  // Render Template 2: UNPOPULAR OPINION
  public static renderUnpopularOpinionSVG(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const headlineLines = wrapText(opts.headline, 24);
    const narrativeLines = wrapText(opts.narrative || "", 38);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="opinBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0E0F14"/>
          <stop offset="100%" stop-color="#07080B"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>

      <rect width="1080" height="1350" fill="url(#opinBg)"/>

      <!-- Accent Top Banner -->
      <rect x="0" y="0" width="1080" height="10" fill="#DC2626"/>

      <!-- Subheader Badge -->
      <g transform="translate(80, 120)">
        <rect x="0" y="0" width="260" height="46" rx="4" fill="#3B1014" stroke="#7F1D1D" stroke-width="1.5"/>
        <text x="130" y="29" fill="#FCA5A5" font-size="16" text-anchor="middle" class="mono" font-weight="700">UNPOPULAR OPINION</text>
        <text x="920" y="29" fill="#94A3B8" font-size="16" text-anchor="end" class="serif">${escapeXml(brandName)}</text>
      </g>

      <!-- Giant Editorial Headline -->
      <g transform="translate(80, 290)">
        ${headlineLines
          .map(
            (line, idx) =>
              `<text x="0" y="${idx * 78}" fill="#FFFFFF" font-size="58" class="serif" letter-spacing="-1">${escapeXml(line)}</text>`
          )
          .join("\n")}
      </g>

      <!-- Central Red Quote Line -->
      <g transform="translate(80, 680)">
        <rect x="0" y="0" width="920" height="260" rx="10" fill="#141724" stroke="#262D42" stroke-width="1.5"/>
        <rect x="0" y="0" width="8" height="260" rx="2" fill="#DC2626"/>
        <g transform="translate(48, 64)">
          ${narrativeLines
            .slice(0, 5)
            .map(
              (line, idx) =>
                `<text x="0" y="${idx * 38}" fill="#E2E8F0" font-size="26" class="sans" font-weight="400">${escapeXml(line)}</text>`
            )
            .join("\n")}
        </g>
      </g>

      <!-- Jury Challenge Prompt -->
      <g transform="translate(80, 1020)">
        <rect x="0" y="0" width="920" height="90" rx="8" fill="#1C1317" stroke="#4A1D24" stroke-width="1"/>
        <text x="40" y="52" fill="#FCA5A5" font-size="22" class="sans" font-weight="600">Can you defend the opposite? Drop your counterargument below.</text>
      </g>

      <!-- Branded Footer -->
      <g transform="translate(80, 1220)">
        <line x1="0" y1="0" x2="920" y2="0" stroke="#202436" stroke-width="1"/>
        <text x="0" y="44" fill="#94A3B8" font-size="18" class="sans" font-weight="600">THE INTERNET IS THE JURY.</text>
        <text x="920" y="44" fill="#EF4444" font-size="18" text-anchor="end" class="mono" font-weight="700">${escapeXml(handle)}</text>
      </g>
    </svg>`;
  }

  // Render Template 3: AURA TAX
  public static renderAuraTaxSVG(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const points = opts.auraPoints ?? -1000;
    const isGain = points > 0;
    const auraBadgeText = isGain ? `+${points.toLocaleString()} AURA` : `${points.toLocaleString()} AURA`;
    const badgeBg = isGain ? "#064E3B" : "#450A0A";
    const badgeStroke = isGain ? "#10B981" : "#EF4444";
    const badgeFg = isGain ? "#6EE7B7" : "#FCA5A5";

    const headlineLines = wrapText(opts.headline, 28);
    const narrativeLines = wrapText(opts.narrative || "", 40);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="auraBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#090A0D"/>
          <stop offset="100%" stop-color="#060709"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>

      <rect width="1080" height="1350" fill="url(#auraBg)"/>

      <!-- Header -->
      <g transform="translate(80, 110)">
        <rect x="0" y="0" width="200" height="42" rx="4" fill="#1A1C28" stroke="#2D324A" stroke-width="1"/>
        <text x="100" y="27" fill="#E2E8F0" font-size="16" text-anchor="middle" class="mono" font-weight="700">AURA AUDIT</text>
        <text x="920" y="27" fill="#94A3B8" font-size="16" text-anchor="end" class="serif">${escapeXml(brandName)}</text>
      </g>

      <!-- Giant Aura Penalty / Reward Badge -->
      <g transform="translate(80, 220)">
        <rect x="0" y="0" width="920" height="210" rx="12" fill="${badgeBg}" stroke="${badgeStroke}" stroke-width="2.5"/>
        <text x="460" y="115" fill="${badgeFg}" font-size="76" font-weight="900" text-anchor="middle" class="mono" letter-spacing="4">${escapeXml(auraBadgeText)}</text>
        <text x="460" y="165" fill="#E2E8F0" font-size="20" font-weight="600" text-anchor="middle" class="sans">BEHAVIOURAL TAX LEVIED BY THE INTERNET JURY</text>
      </g>

      <!-- Scenario Headline -->
      <g transform="translate(80, 520)">
        <text x="0" y="0" fill="#94A3B8" font-size="16" class="mono" font-weight="700">THE SCENARIO IN QUESTION:</text>
        <g transform="translate(0, 50)">
          ${headlineLines
            .map(
              (line, idx) =>
                `<text x="0" y="${idx * 64}" fill="#FFFFFF" font-size="46" class="serif">${escapeXml(line)}</text>`
            )
            .join("\n")}
        </g>
      </g>

      <!-- Psychological Breakdown Box -->
      <g transform="translate(80, 840)">
        <rect x="0" y="0" width="920" height="200" rx="10" fill="#121520" stroke="#212638" stroke-width="1.5"/>
        <text x="40" y="52" fill="#F87171" font-size="17" class="mono" font-weight="700">WHY THIS DESTROYS YOUR AURA:</text>
        <g transform="translate(40, 94)">
          ${narrativeLines
            .slice(0, 3)
            .map(
              (line, idx) =>
                `<text x="0" y="${idx * 34}" fill="#CBD5E1" font-size="22" class="sans">${escapeXml(line)}</text>`
            )
            .join("\n")}
        </g>
      </g>

      <!-- Jury Verdict Prompt -->
      <g transform="translate(80, 1100)">
        <rect x="0" y="0" width="920" height="74" rx="6" fill="#171A26" stroke="#252A3D" stroke-width="1"/>
        <text x="460" y="44" fill="#FFFFFF" font-size="20" class="sans" text-anchor="middle" font-weight="600">Too harsh or accurate penalty? Drop your verdict below.</text>
      </g>

      <!-- Footer -->
      <g transform="translate(80, 1240)">
        <line x1="0" y1="0" x2="920" y2="0" stroke="#1E2336" stroke-width="1"/>
        <text x="0" y="38" fill="#94A3B8" font-size="18" class="sans" font-weight="600">THE INTERNET IS THE JURY.</text>
        <text x="920" y="38" fill="#F87171" font-size="18" text-anchor="end" class="mono" font-weight="700">${escapeXml(handle)}</text>
      </g>
    </svg>`;
  }

  // Render Template 4: TWO SIDES (Split Panel Dilemma)
  public static renderTwoSidesSVG(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const headlineLines = wrapText(opts.headline, 28);
    const sideA = opts.sideA || { title: "Position A: Complete Equality", argument: "50-50 preserves respect, independence, and prevents hidden entitlement." };
    const sideB = opts.sideB || { title: "Position B: Income Proportionality", argument: "Splitting 50-50 on a 3x income gap causes financial anxiety and silent resentment." };

    const sideALines = wrapText(sideA.argument, 22);
    const sideBLines = wrapText(sideB.argument, 22);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="splitBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B0C10"/>
          <stop offset="100%" stop-color="#060709"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>

      <rect width="1080" height="1350" fill="url(#splitBg)"/>

      <!-- Header -->
      <g transform="translate(80, 110)">
        <rect x="0" y="0" width="180" height="42" rx="4" fill="#1C1F2E" stroke="#2D334A" stroke-width="1"/>
        <text x="90" y="26" fill="#F87171" font-size="16" text-anchor="middle" class="mono" font-weight="700">TWO SIDES</text>
        <text x="920" y="26" fill="#E2E8F0" font-size="16" text-anchor="end" class="serif">${escapeXml(brandName)}</text>
      </g>

      <!-- Central Dilemma Headline -->
      <g transform="translate(80, 210)">
        ${headlineLines
          .map(
            (line, idx) =>
              `<text x="0" y="${idx * 60}" fill="#FFFFFF" font-size="46" class="serif">${escapeXml(line)}</text>`
          )
          .join("\n")}
      </g>

      <!-- Two Split Columns Side by Side -->
      <g transform="translate(80, 480)">
        <!-- Side A Box -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="440" height="580" rx="10" fill="#131726" stroke="#2A3350" stroke-width="1.5"/>
          <rect x="0" y="0" width="440" height="60" rx="10" fill="#1C2338"/>
          <text x="220" y="38" fill="#38BDF8" font-size="20" font-weight="700" text-anchor="middle" class="mono">SIDE A: ${escapeXml(sideA.title)}</text>
          <g transform="translate(32, 100)">
            ${sideALines
              .map(
                (line, idx) =>
                  `<text x="0" y="${idx * 34}" fill="#E2E8F0" font-size="22" class="sans">${escapeXml(line)}</text>`
              )
              .join("\n")}
          </g>
        </g>

        <!-- Side B Box -->
        <g transform="translate(480, 0)">
          <rect x="0" y="0" width="440" height="580" rx="10" fill="#1C141E" stroke="#4A263C" stroke-width="1.5"/>
          <rect x="0" y="0" width="440" height="60" rx="10" fill="#2D1A2A"/>
          <text x="220" y="38" fill="#F43F5E" font-size="20" font-weight="700" text-anchor="middle" class="mono">SIDE B: ${escapeXml(sideB.title)}</text>
          <g transform="translate(32, 100)">
            ${sideBLines
              .map(
                (line, idx) =>
                  `<text x="0" y="${idx * 34}" fill="#E2E8F0" font-size="22" class="sans">${escapeXml(line)}</text>`
              )
              .join("\n")}
          </g>
        </g>
      </g>

      <!-- Versus Divider Badge -->
      <g transform="translate(540, 770)">
        <circle cx="0" cy="0" r="32" fill="#0B0C10" stroke="#DC2626" stroke-width="3"/>
        <text x="0" y="8" fill="#FFFFFF" font-size="18" font-weight="900" text-anchor="middle" class="mono">VS</text>
      </g>

      <!-- Prompt Banner -->
      <g transform="translate(80, 1100)">
        <rect x="0" y="0" width="920" height="80" rx="8" fill="#161824" stroke="#252A3D" stroke-width="1"/>
        <text x="460" y="48" fill="#FFFFFF" font-size="22" class="sans" text-anchor="middle" font-weight="600">Which side represents true maturity? Cast your verdict below.</text>
      </g>

      <!-- Footer -->
      <g transform="translate(80, 1240)">
        <line x1="0" y1="0" x2="920" y2="0" stroke="#1E2336" stroke-width="1"/>
        <text x="0" y="38" fill="#94A3B8" font-size="18" class="sans" font-weight="600">THE INTERNET IS THE JURY.</text>
        <text x="920" y="38" fill="#F87171" font-size="18" text-anchor="end" class="mono" font-weight="700">${escapeXml(handle)}</text>
      </g>
    </svg>`;
  }

  // Helper: Top progress dots
  private static renderDots(slideIdx: number, total: number = 5): string {
    return `
      <g transform="translate(80, 50)">
        ${Array.from({ length: total })
          .map((_, i) => {
            const x = i * 35;
            const isCurrent = i + 1 === slideIdx;
            return `<circle cx="${x}" cy="10" r="${isCurrent ? 7 : 4}" fill="${isCurrent ? "#DC2626" : "#2E344A"}"/>`;
          })
          .join("\n")}
        <text x="920" y="16" fill="#94A3B8" font-size="16" text-anchor="end" class="mono" font-weight="700">${slideIdx} / ${total}</text>
      </g>
    `;
  }

  // Helper: Top badge and branding
  private static renderHeaderBadge(badgeText: string, brandName: string = "UNFILTERED LORE"): string {
    const badgeWidth = Math.min(420, Math.max(220, badgeText.length * 13 + 30));
    return `
      <g transform="translate(80, 100)">
        <rect x="0" y="0" width="${badgeWidth}" height="40" rx="4" fill="#1C1F2E" stroke="#2D334A" stroke-width="1"/>
        <text x="${badgeWidth / 2}" y="25" fill="#F87171" font-size="15" text-anchor="middle" class="mono" font-weight="700">${escapeXml(badgeText)}</text>
        <text x="920" y="26" fill="#E2E8F0" font-size="16" text-anchor="end" class="serif">${escapeXml(brandName)}</text>
      </g>
    `;
  }

  // Helper: Standardized branded footer
  private static renderFooter(handle: string = "@_unfiltered_lore_"): string {
    return `
      <g transform="translate(80, 1260)">
        <line x1="0" y1="0" x2="920" y2="0" stroke="#1E2336" stroke-width="1"/>
        <text x="0" y="38" fill="#94A3B8" font-size="16" class="sans" font-weight="600">THE INTERNET IS THE JURY.</text>
        <text x="920" y="38" fill="#F87171" font-size="16" text-anchor="end" class="mono" font-weight="700">${escapeXml(handle)}</text>
      </g>
    `;
  }

  // Engine 5 Slide 1: High-Retention Cover Hook
  public static renderCarouselCoverSlide(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const caseNum = opts.caseNumber || "CASE #104";
    const pillarTag = opts.pillar?.replace(/_/g, " ") || "RELATIONSHIPS";
    const headlineLines = wrapText(opts.headline, 24);
    const narrativeLines = wrapText(opts.narrative || "", 38);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGradCover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B0C10"/>
          <stop offset="60%" stop-color="#10121A"/>
          <stop offset="100%" stop-color="#08090C"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>
      <rect width="1080" height="1350" fill="url(#bgGradCover)"/>
      ${this.renderDots(1, opts.slideTotal || 5)}
      ${this.renderHeaderBadge(`${caseNum} • ${pillarTag}`, brandName)}

      <!-- Main Dilemma Headline -->
      <g transform="translate(80, 220)">
        ${headlineLines
          .map((l, i) => `<text x="0" y="${i * 70}" fill="#FFFFFF" font-size="52" class="serif">${escapeXml(l)}</text>`)
          .join("\n")}
      </g>

      <!-- Crimson Divider Accent -->
      <line x1="80" y1="520" x2="280" y2="520" stroke="#DC2626" stroke-width="4"/>
      <line x1="290" y1="520" x2="1000" y2="520" stroke="#22283A" stroke-width="1"/>

      <!-- Narrative Teaser -->
      <g transform="translate(80, 560)">
        <rect x="0" y="0" width="920" height="260" rx="10" fill="#131622" stroke="#23283B" stroke-width="1.2"/>
        <rect x="0" y="0" width="8" height="260" rx="2" fill="#DC2626"/>
        <g transform="translate(44, 56)">
          ${narrativeLines
            .slice(0, 5)
            .map((l, i) => `<text x="0" y="${i * 38}" fill="#CBD5E1" font-size="24" class="sans">${escapeXml(l)}</text>`)
            .join("\n")}
        </g>
      </g>

      <!-- High-Conversion Retention Hook / Swipe Pill -->
      <g transform="translate(80, 890)">
        <rect x="0" y="0" width="920" height="130" rx="12" fill="#1C1014" stroke="#DC2626" stroke-width="2"/>
        <text x="460" y="52" fill="#FCA5A5" font-size="24" font-weight="900" class="mono" text-anchor="middle">🚨 EXHIBIT A: RAW CHATS ON NEXT SLIDE</text>
        <text x="460" y="92" fill="#FFFFFF" font-size="20" class="sans" text-anchor="middle" font-weight="600">Swipe to inspect the 2:14 AM text message ➔</text>
      </g>

      ${this.renderFooter(handle)}
    </svg>`;
  }

  // Engine 5 Slide 2: WhatsApp Chat Evidence (2nd-Impression Retention Maximizer)
  public static renderWhatsAppChatSlide(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const slideIdx = opts.slideIndex || 2;
    const slideTotal = opts.slideTotal || 5;
    const contactName = opts.chatContactName || "Rohan (Bumble 🚩)";

    const messages = (opts.chatMessages && opts.chatMessages.length > 0)
      ? opts.chatMessages
      : [
          { sender: "THEM" as const, text: "Can you send ₹70 for the soup? Sent you the split bill screenshot.", time: "02:14 AM" },
          { sender: "ME" as const, text: "You make ₹28 LPA and we've been dating 8 months... are we really splitting ₹70 at 2 AM? 💀", time: "02:15 AM" },
          { sender: "THEM" as const, text: "It's not about the money, it's about the principle. 50/50 means 50/50 always.", time: "02:16 AM" },
          { sender: "ME" as const, text: "Cool. Sending ₹70 right now.", time: "02:17 AM" },
        ];

    let bubblesSvg = "";
    let currentY = 320;

    for (const msg of messages.slice(0, 5)) {
      const isMe = msg.sender === "ME";
      const lines = wrapText(msg.text, isMe ? 28 : 30);
      const lineCount = lines.length;
      const bubbleHeight = 24 + lineCount * 30 + 26;
      const maxLineLen = Math.max(...lines.map((l) => l.length));
      const bubbleWidth = Math.min(680, Math.max(300, maxLineLen * 14 + 50));
      const bubbleX = isMe ? 980 - bubbleWidth : 100;
      const bubbleBg = isMe ? "#005C4B" : "#202C33";
      const msgTime = msg.time || "02:14 AM";

      bubblesSvg += `
        <g transform="translate(${bubbleX}, ${currentY})">
          <rect x="0" y="0" width="${bubbleWidth}" height="${bubbleHeight}" rx="14" fill="${bubbleBg}"/>
          <g transform="translate(20, 30)">
            ${lines
              .map((l, idx) => `<text x="0" y="${idx * 30}" fill="#E9EDEF" font-size="22" class="sans">${escapeXml(l)}</text>`)
              .join("\n")}
          </g>
          <g transform="translate(${bubbleWidth - (isMe ? 95 : 75)}, ${bubbleHeight - 10})">
            <text x="0" y="0" fill="#8696A0" font-size="13" class="sans">${msgTime}</text>
            ${isMe ? `<text x="56" y="0" fill="#53BDEB" font-size="14" font-weight="bold">✓✓</text>` : ""}
          </g>
        </g>
      `;
      currentY += bubbleHeight + 20;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGradWhatsApp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B141A"/>
          <stop offset="50%" stop-color="#0E181E"/>
          <stop offset="100%" stop-color="#080D11"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>
      <rect width="1080" height="1350" fill="url(#bgGradWhatsApp)"/>
      ${this.renderDots(slideIdx, slideTotal)}
      ${this.renderHeaderBadge("EXHIBIT A • RAW EVIDENCE", brandName)}

      <!-- WhatsApp Interface Header Bar -->
      <g transform="translate(80, 170)">
        <rect x="0" y="0" width="920" height="80" rx="14" fill="#1F2C34" stroke="#2A3942" stroke-width="1.5"/>
        <text x="24" y="48" fill="#8696A0" font-size="28" font-weight="bold">←</text>
        <circle cx="78" cy="40" r="24" fill="#00A884"/>
        <text x="78" y="47" fill="#FFFFFF" font-size="18" font-weight="bold" text-anchor="middle">
          ${escapeXml((contactName[0] || "U").toUpperCase())}
        </text>
        <text x="116" y="36" fill="#E9EDEF" font-size="22" font-weight="bold" class="sans">${escapeXml(contactName)}</text>
        <text x="116" y="58" fill="#8696A0" font-size="14" class="sans">online • 02:14 AM</text>
        <text x="860" y="48" fill="#8696A0" font-size="24">⋮</text>
      </g>

      <!-- Encryption Notice -->
      <g transform="translate(80, 275)">
        <rect x="220" y="0" width="480" height="28" rx="6" fill="#182229"/>
        <text x="460" y="19" fill="#8696A0" font-size="12" text-anchor="middle" class="sans">🔒 Messages and calls are end-to-end encrypted</text>
      </g>

      ${bubblesSvg}

      <!-- Retention Swipe Banner -->
      <g transform="translate(80, 1140)">
        <rect x="0" y="0" width="920" height="64" rx="8" fill="#161824" stroke="#DC2626" stroke-width="1.5"/>
        <text x="460" y="40" fill="#FFFFFF" font-size="18" class="mono" font-weight="700" text-anchor="middle">
          SWIPE FOR EXHIBIT B • THE DILEMMA BREAKDOWN ➔
        </text>
      </g>

      ${this.renderFooter(handle)}
    </svg>`;
  }

  // Engine 5 Slide 3: The Dilemma Breakdown (Split Perspectives)
  public static renderCarouselContextSlide(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const slideIdx = opts.slideIndex || 3;
    const slideTotal = opts.slideTotal || 5;

    const sideA = opts.sideA || {
      title: "Position A: Strict 50/50",
      argument: "Equal contribution preserves personal independence, financial boundaries, and stops hidden relationship resentment before it starts.",
    };
    const sideB = opts.sideB || {
      title: "Position B: Income Equity",
      argument: "When one partner makes ₹28 LPA and the other ₹7 LPA, splitting a ₹70 soup at 2 AM is toxic transactional penny-pinching masquerading as equality.",
    };

    const sideALines = wrapText(sideA.argument, 22);
    const sideBLines = wrapText(sideB.argument, 22);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGradContext" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B0C10"/>
          <stop offset="100%" stop-color="#060709"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>
      <rect width="1080" height="1350" fill="url(#bgGradContext)"/>
      ${this.renderDots(slideIdx, slideTotal)}
      ${this.renderHeaderBadge("EXHIBIT B • THE TWO SIDES", brandName)}

      <g transform="translate(80, 200)">
        <text x="0" y="0" fill="#FFFFFF" font-size="44" class="serif">The Underlying Moral Conflict</text>
      </g>

      <!-- Side-by-Side Cards -->
      <g transform="translate(80, 310)">
        <!-- Side A -->
        <g transform="translate(0, 0)">
          <rect x="0" y="0" width="440" height="680" rx="10" fill="#131726" stroke="#2A3350" stroke-width="1.5"/>
          <rect x="0" y="0" width="440" height="60" rx="10" fill="#1C2338"/>
          <text x="220" y="38" fill="#38BDF8" font-size="18" font-weight="700" text-anchor="middle" class="mono">${escapeXml(sideA.title)}</text>
          <g transform="translate(28, 100)">
            ${sideALines
              .map((l, i) => `<text x="0" y="${i * 34}" fill="#E2E8F0" font-size="22" class="sans">${escapeXml(l)}</text>`)
              .join("\n")}
          </g>
        </g>

        <!-- Side B -->
        <g transform="translate(480, 0)">
          <rect x="0" y="0" width="440" height="680" rx="10" fill="#1C141E" stroke="#4A263C" stroke-width="1.5"/>
          <rect x="0" y="0" width="440" height="60" rx="10" fill="#2D1A2A"/>
          <text x="220" y="38" fill="#F43F5E" font-size="18" font-weight="700" text-anchor="middle" class="mono">${escapeXml(sideB.title)}</text>
          <g transform="translate(28, 100)">
            ${sideBLines
              .map((l, i) => `<text x="0" y="${i * 34}" fill="#E2E8F0" font-size="22" class="sans">${escapeXml(l)}</text>`)
              .join("\n")}
          </g>
        </g>
      </g>

      <!-- VS Divider Badge -->
      <g transform="translate(540, 650)">
        <circle cx="0" cy="0" r="32" fill="#0B0C10" stroke="#DC2626" stroke-width="3"/>
        <text x="0" y="8" fill="#FFFFFF" font-size="18" font-weight="900" text-anchor="middle" class="mono">VS</text>
      </g>

      <!-- Swipe Prompt Banner -->
      <g transform="translate(80, 1140)">
        <rect x="0" y="0" width="920" height="64" rx="8" fill="#161824" stroke="#DC2626" stroke-width="1.5"/>
        <text x="460" y="40" fill="#FFFFFF" font-size="18" class="mono" font-weight="700" text-anchor="middle">
          SWIPE FOR THE AURA AUDIT ➔
        </text>
      </g>

      ${this.renderFooter(handle)}
    </svg>`;
  }

  // Engine 5 Slide 4: Aura Audit / Psychological Tax Assessment
  public static renderCarouselAuraSlide(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const slideIdx = opts.slideIndex || 4;
    const slideTotal = opts.slideTotal || 5;

    const points = opts.auraPoints ?? -1500;
    const isGain = points > 0;
    const auraBadgeText = isGain ? `+${points.toLocaleString()} AURA` : `${points.toLocaleString()} AURA`;
    const badgeBg = isGain ? "#064E3B" : "#450A0A";
    const badgeStroke = isGain ? "#10B981" : "#EF4444";
    const badgeFg = isGain ? "#6EE7B7" : "#FCA5A5";

    const narrative = opts.narrative ||
      "Splitting bills mathematically is fine on paper. But demanding ₹70 over UPI at 2 AM from your partner signals extreme transactional anxiety, zero romantic warmth, and an inability to be generous.";
    const narrativeLines = wrapText(narrative, 38);

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGradAura" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#090A0D"/>
          <stop offset="100%" stop-color="#060709"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>
      <rect width="1080" height="1350" fill="url(#bgGradAura)"/>
      ${this.renderDots(slideIdx, slideTotal)}
      ${this.renderHeaderBadge("EXHIBIT C • AURA AUDIT", brandName)}

      <!-- Giant Aura Badge -->
      <g transform="translate(80, 200)">
        <rect x="0" y="0" width="920" height="210" rx="12" fill="${badgeBg}" stroke="${badgeStroke}" stroke-width="2.5"/>
        <text x="460" y="115" fill="${badgeFg}" font-size="76" font-weight="900" text-anchor="middle" class="mono" letter-spacing="4">${escapeXml(auraBadgeText)}</text>
        <text x="460" y="165" fill="#E2E8F0" font-size="20" font-weight="600" text-anchor="middle" class="sans">BEHAVIOURAL PENALTY LEVIED BY THE INTERNET JURY</text>
      </g>

      <!-- Psychological Assessment Box -->
      <g transform="translate(80, 480)">
        <text x="0" y="0" fill="#94A3B8" font-size="17" class="mono" font-weight="700">PSYCHOLOGICAL ASSESSMENT:</text>
        <g transform="translate(0, 30)">
          <rect x="0" y="0" width="920" height="420" rx="10" fill="#121520" stroke="#212638" stroke-width="1.5"/>
          <rect x="0" y="0" width="8" height="420" rx="2" fill="#EF4444"/>
          <g transform="translate(40, 60)">
            ${narrativeLines
              .slice(0, 7)
              .map((l, i) => `<text x="0" y="${i * 38}" fill="#CBD5E1" font-size="24" class="sans">${escapeXml(l)}</text>`)
              .join("\n")}
          </g>
        </g>
      </g>

      <!-- Retention Swipe Banner -->
      <g transform="translate(80, 1140)">
        <rect x="0" y="0" width="920" height="64" rx="8" fill="#161824" stroke="#DC2626" stroke-width="1.5"/>
        <text x="460" y="40" fill="#FFFFFF" font-size="18" class="mono" font-weight="700" text-anchor="middle">
          SWIPE TO CAST YOUR VERDICT ➔
        </text>
      </g>

      ${this.renderFooter(handle)}
    </svg>`;
  }

  // Engine 5 Slide 5: The Internet Is The Jury Final Verdict
  public static renderCarouselVerdictSlide(opts: RenderCardOptions): string {
    const brandName = opts.brandName || "UNFILTERED LORE";
    const handle = opts.handle || "@_unfiltered_lore_";
    const slideIdx = opts.slideIndex || 5;
    const slideTotal = opts.slideTotal || 5;

    const options = opts.options || [
      { key: "A", label: "Fair — Equal contribution protects personal dignity" },
      { key: "B", label: "Petty — Counting ₹70 at 2 AM kills relationship intimacy" },
      { key: "C", label: "Red Flag — Insensitive to salary disparity and context" },
      { key: "D", label: "Both are toxic — Neither communicates like an adult" },
    ];

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
      <defs>
        <linearGradient id="bgGradVerdict" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B0C10"/>
          <stop offset="60%" stop-color="#12141F"/>
          <stop offset="100%" stop-color="#08090C"/>
        </linearGradient>
      </defs>
      <style>
        .serif { font-family: 'Georgia', 'Playfair Display', serif; font-weight: 700; }
        .sans { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; }
        .mono { font-family: 'SF Mono', 'Courier New', monospace; letter-spacing: 2px; }
      </style>
      <rect width="1080" height="1350" fill="url(#bgGradVerdict)"/>
      ${this.renderDots(slideIdx, slideTotal)}
      ${this.renderHeaderBadge("FINAL SLIDE • THE VERDICT", brandName)}

      <!-- Title -->
      <g transform="translate(80, 180)">
        <text x="0" y="0" fill="#FFFFFF" font-size="46" class="serif">The Internet Is The Jury.</text>
        <text x="0" y="40" fill="#94A3B8" font-size="20" class="sans">Cast your vote by choosing an option below:</text>
      </g>

      <!-- 4 Verdict Options -->
      <g transform="translate(80, 290)">
        ${options
          .slice(0, 4)
          .map((opt, i) => {
            const y = i * 115;
            const optLines = wrapText(opt.label, 36);
            return `
            <g transform="translate(0, ${y})">
              <rect x="0" y="0" width="920" height="96" rx="10" fill="#141724" stroke="#272D40" stroke-width="1.2"/>
              <rect x="18" y="18" width="60" height="60" rx="8" fill="#1F2436" stroke="#DC2626" stroke-width="1.5"/>
              <text x="48" y="56" fill="#FFFFFF" font-size="26" font-weight="700" text-anchor="middle" class="serif">${opt.key}</text>
              <g transform="translate(96, 38)">
                ${optLines
                  .map((l, idx) => `<text x="0" y="${idx * 28}" fill="#E2E8F0" font-size="21" class="sans" font-weight="500">${escapeXml(l)}</text>`)
                  .join("\n")}
              </g>
            </g>`;
          })
          .join("\n")}
      </g>

      <!-- Ruthless Comment Call To Action -->
      <g transform="translate(80, 890)">
        <rect x="0" y="0" width="920" height="150" rx="12" fill="#1C1014" stroke="#DC2626" stroke-width="2"/>
        <text x="460" y="55" fill="#FFFFFF" font-size="24" font-weight="900" class="mono" text-anchor="middle">💬 COMMENT 'A', 'B', 'C' OR 'D' WITH YOUR VERDICT</text>
        <text x="460" y="95" fill="#FCA5A5" font-size="18" class="sans" text-anchor="middle" font-weight="600">The most ruthless, well-argued comment gets pinned at the top.</text>
        <text x="460" y="125" fill="#94A3B8" font-size="15" class="sans" text-anchor="middle">@_unfiltered_lore_</text>
      </g>

      ${this.renderFooter(handle)}
    </svg>`;
  }

  // Master individual slide generator dispatcher
  public static renderCarouselSlideSVG(opts: RenderCardOptions): string {
    const slideIdx = opts.slideIndex || 1;
    const slideTotal = opts.slideTotal || 5;
    const slideType = (opts.slideType || "").toUpperCase();

    // Slide 2: WhatsApp Chat Evidence (Engine 5 2nd-impression algorithm hook)
    if (slideType === "CHAT_EVIDENCE" || (slideIdx === 2 && slideTotal >= 2)) {
      return this.renderWhatsAppChatSlide(opts);
    }

    // Slide 1: Cover Hook
    if (slideType === "COVER" || slideIdx === 1) {
      return this.renderCarouselCoverSlide(opts);
    }

    // Slide 4: Aura Audit / Psychological Tax
    if (slideType === "AURA_AUDIT" || (slideIdx === 4 && slideTotal >= 4)) {
      return this.renderCarouselAuraSlide(opts);
    }

    // Slide 5: Verdict Options / Internet is the Jury
    if (slideType === "PROMPT" || slideType === "OPTIONS" || slideType === "VERDICT" || slideIdx === slideTotal) {
      return this.renderCarouselVerdictSlide(opts);
    }

    // Slide 3 (or any intermediate contextual slide): Context / Dilemma Breakdown
    return this.renderCarouselContextSlide(opts);
  }

  // Master generator dispatcher
  public static generateSVG(opts: RenderCardOptions): string {
    switch (opts.templateCode) {
      case "THE_COURTROOM":
        return this.renderCourtroomSVG(opts);
      case "UNPOPULAR_OPINION":
        return this.renderUnpopularOpinionSVG(opts);
      case "AURA_TAX":
        return this.renderAuraTaxSVG(opts);
      case "TWO_SIDES":
        return this.renderTwoSidesSVG(opts);
      case "MULTI_SLIDE_CAROUSEL":
        return this.renderCarouselSlideSVG(opts);
      default:
        return this.renderCourtroomSVG(opts);
    }
  }

  // Convert SVG to data URI
  public static svgToDataUri(svgString: string): string {
    const base64 = Buffer.from(svgString).toString("base64");
    return `data:image/svg+xml;base64,${base64}`;
  }
}
