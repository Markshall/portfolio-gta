// Content mirrors ../mark-eriksson.com (src/data/projects.ts), trimmed to what this page shows.
export interface Project {
  id: string;
  name: string;
  role: string;
  url: string;
  cat: "Work" | "Personal";
  year: number;
  stack: string[];
  summary: string;
  retired?: { year: number; snapshot?: string };
}

const WP = ["WordPress", "PHP", "TypeScript", "Vite", "AWS", "Cloudflare"];
const WP_TOOLS = ["WordPress", "PHP", "TypeScript", "Web Components", "Vite", "AWS", "Cloudflare"];

export const PROJECTS: Project[] = [
  {
    id: "crown-oil",
    name: "Crown Oil",
    role: "Lead developer",
    url: "www.crownoil.co.uk",
    cat: "Work",
    year: 2019,
    stack: WP_TOOLS,
    summary:
      "The group’s flagship site, for a UK fuel and lubricants supplier trading since 1947. A custom WordPress theme with product pages for HVO, DERV, red diesel and lubricants, a tank size calculator, and quote forms that feed the company’s CRM.",
  },
  {
    id: "speedy-fuels",
    name: "Speedy Fuels",
    role: "Lead developer",
    url: "www.speedyfuels.co.uk",
    cat: "Work",
    year: 2021,
    stack: WP_TOOLS,
    summary:
      "A nationwide fuel delivery brand in the Crown Oil group. A custom WordPress theme built around its top products, with a quick quote form that goes straight into the group’s CRM.",
  },
  {
    id: "speedy-fuels-sustainability",
    name: "Speedy Fuels Sustainability",
    role: "Lead developer",
    url: "sustainability.speedyfuels.co.uk",
    cat: "Work",
    year: 2023,
    stack: WP_TOOLS,
    summary:
      "A standalone site setting out Speedy Fuels’ carbon-neutral certification and its path to Net Zero, with a carbon calculator showing the carbon saved by switching from diesel to HVO.",
  },
  {
    id: "crown-oil-sustainability",
    name: "Crown Oil Sustainability",
    role: "Lead developer",
    url: "sustainability.crownoil.co.uk",
    cat: "Work",
    year: 2022,
    stack: WP_TOOLS,
    summary:
      "The sustainability hub for the UK’s first carbon-neutral fuel supplier, covering its Net Zero pledge and ESG framework, with a carbon calculator showing the carbon saved by switching from diesel to HVO.",
  },
  {
    id: "crown-oil-environmental",
    name: "Crown Oil Environmental",
    role: "Lead developer",
    url: "www.crownoilenvironmental.co.uk",
    cat: "Work",
    year: 2022,
    stack: WP_TOOLS,
    summary:
      "The site for Crown Oil’s industrial services arm: tank cleaning and lining, integrity testing and fuel buyback for commercial customers. A custom WordPress theme with service, sector and case study pages.",
  },
  {
    id: "nationwide-fuels",
    name: "Nationwide Fuels",
    role: "Lead developer",
    url: "www.nationwidefuels.co.uk",
    cat: "Work",
    year: 2020,
    stack: WP_TOOLS,
    summary:
      "A fuel and lubricants brand serving the construction, agricultural and industrial sectors. A custom WordPress theme with a page for each fuel type, including heating oil, and quote forms that feed the group’s CRM.",
  },
  {
    id: "crown-energy",
    name: "Crown Energy",
    role: "Lead developer",
    url: "www.crownenergy.co.uk",
    cat: "Work",
    year: 2026,
    stack: WP,
    summary:
      "A gas, electricity and water connections business for homeowners and businesses, including options to spread the cost of domestic projects. The group’s newest custom WordPress theme.",
  },
  {
    id: "birlem-oil",
    name: "Birlem Oil",
    role: "Lead developer",
    url: "www.birlemoil.co.uk",
    cat: "Work",
    year: 2018,
    stack: WP,
    summary:
      "A nationwide fuel and lubricants brand in the group. A custom WordPress theme focused on its most popular products and delivery coverage, with quote forms that feed the group’s CRM.",
  },
  {
    id: "inworkat",
    name: "InWorkAt",
    role: "Project creator & developer",
    url: "www.inwork.at",
    cat: "Personal",
    year: 2015,
    stack: ["Laravel / PHP", "Vite", "PWA"],
    summary:
      "A free web app for UK shift workers: enter the shifts on your rota and it adds up hours, overtime and holiday, then estimates take-home pay so you can check it against your payslip. Works offline.",
  },
  {
    id: "checkcheck",
    name: "CheckCheck",
    role: "Creator",
    url: "www.mark-eriksson.com/check",
    cat: "Personal",
    year: 2015,
    stack: ["Vanilla JS"],
    summary:
      "A small tool that finds the check character for a warehouse shelf location, or reverse-looks-up every location sharing a given check character.",
  },
  {
    id: "crown-energy-2020",
    name: "Crown Energy (2020)",
    role: "Lead developer",
    url: "www.crownenergy.co.uk",
    cat: "Work",
    year: 2020,
    stack: WP,
    summary:
      "The previous Crown Energy site, for its gas, electricity and water connections business serving homes, businesses, the public sector and construction. Live until the 2026 rebuild replaced it.",
    retired: { year: 2026, snapshot: "20250613155358" },
  },
  {
    id: "crown-oil-careers",
    name: "Crown Oil Careers",
    role: "Lead developer",
    url: "www.crownoilcareers.co.uk",
    cat: "Work",
    year: 2024,
    stack: WP,
    summary:
      "The recruitment site for the Crown Oil group, with current vacancies, pages for each location, benefits and culture, and a register-your-interest form that takes CV uploads.",
    retired: { year: 2026, snapshot: "20250619211541" },
  },
  {
    id: "rockdoor",
    name: "Rockdoor",
    role: "Lead developer",
    url: "www.rockdoor.com",
    cat: "Work",
    year: 2022,
    stack: WP,
    summary:
      "The site for a UK manufacturer of high-security composite doors, with a gallery of door styles, colours and glass designs, product and security guides, and a postcode search for finding a trusted installer.",
    retired: { year: 2026, snapshot: "20251023040159" },
  },
];

export function siteHref(p: Project): string | undefined {
  if (!p.retired) return `https://${p.url}/`;
  return p.retired.snapshot && `https://web.archive.org/web/${p.retired.snapshot}/https://${p.url}/`;
}

export function years(p: Project): string {
  return p.retired ? `${p.year}–${p.retired.year}` : String(p.year);
}

const CAREER_START = new Date(2018, 6);
export const careerYears = () =>
  Math.floor((Date.now() - CAREER_START.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
