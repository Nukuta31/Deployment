/**
 * Rich mock virtual documents to showcase slow, chunked server-side streaming
 * and provide reliable, realistic offline-reading content.
 */

export interface VirtualDoc {
  title: string;
  content: string;
}

export const VIRTUAL_DOCUMENTS: Record<string, VirtualDoc> = {
  "react-guide": {
    title: "React 19 & Vite Developer Handbook",
    content: `# React 19 & Vite Developer Handbook

React 19 introduces a suite of new features focused on improving developer ergonomics, simplifying state management, and automating optimizations that previously required manual tuning with hooks like \`useMemo\` and \`useCallback\`.

## 1. The React Compiler (React Forget)
In previous versions, developers spent excessive time micro-optimizing render performance:
* Wrapping components in \`React.memo()\`
* Wrapping functions in \`useCallback()\`
* Wrapping computed arrays in \`useMemo()\`

The React 19 Compiler automates these memoization steps during build time, letting you write plain JavaScript while ensuring that your application only re-renders components when their actual state or props change.

## 2. Server Components (RSC) and Actions
With server-side integration, React 19 unifies client-side interactivity with server-rendered efficiency.
* **Server Components**: Run exclusively on the server, resulting in zero client-side bundle impact. Highly recommended for static layouts, markdown representations, and header components.
* **Server Actions**: Enable form submissions directly linked to server functions without creating tedious custom API router files.

\`\`\`tsx
// Example of a Server Action in Form Submission
function SearchForm() {
  async function performAction(formData: FormData) {
    'use server';
    const keyword = formData.get("query");
    console.log("Searching for:", keyword);
  }

  return (
    <form action={performAction} className="space-y-4">
      <input name="query" className="border p-2 rounded" />
      <button type="submit">Query Keyword</button>
    </form>
  );
}
\`\`\`

## 3. The New \`useActionState\` Hook
Managing async transactions, pending indicators, error feedback, and form response payloads is simplified with the new \`useActionState\` Hook:

\`\`\`tsx
import { useActionState } from 'react';

async function updateProfile(prevState: any, formData: FormData) {
  try {
    await saveToServer(formData);
    return { success: true, message: "Saved!" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

function ProfileForm() {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction}>
      <input name="username" required />
      <button disabled={isPending}>
        {isPending ? "Saving Profile..." : "Submit Profile"}
      </button>
      {state && <p className="text-sm mt-2">{state.message}</p>}
    </form>
  );
}
\`\`\`

## 4. The \`use\` API
No more wrapping async promises in nested \`useEffect\` logic! The new \`use\` API allows inline resolution of Promises and Context elements anywhere in the render hierarchy:

\`\`\`tsx
import { use } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise); // Resolves directly in render!
  return <div>Active Profile: {user.name}</div>;
}
\`\`\`

## 5. Web Assets Preloading
React 19 supports fine-tuned assets orchestration. Native preloading controls are baked directly into React so that metadata headers can hint browsers to download elements concurrently before they are actually evaluated:

* \`preinit("https://fonts.cdn.com/...", { as: "style" })\`
* \`preload("https://image.com/hero.png", { as: "image" })\`

This handbook can be read completely offline anytime after downloading through this dashboard!`
  },
  "mars-mission": {
    title: "Artemis & Mars Expedition Project Log",
    content: `# Artemis & Mars Expedition Project Log

**Mission Identifier:** AMXP-2032-V6  
**Security Clearance:** PUBLIC SECTOR INFO  
**Classification:** ARCHITECTURAL DEPLOYMENT COMPILATION  

---

## Executive Summary
This document outlines the strategic pipeline for transporting human habitats, atmospheric regulators, and automated farming hubs to the Jezero and Utopia Planitia sites on Mars. By leveraging a low-Earth-orbit refueling scheme, we maximize payload retention, reducing orbital drag and fuel inefficiencies during Trans-Mars Injection (TMI).

## 1. Payload Parameters and Trajectory
* **Transit Vehicle Class:** Star-Heavy Cargo Shuttles (SHCS-V)
* **Maximum Payload Capacity:** 150 Metric Tons to LMO (Low Mars Orbit)
* **Launch Site:** Kennedy Orbital Complex LC-39C
* **Launch Date Projections:** October 2033 Launch Window (Synodic Alignment)

### Trajectory Timeline
1. **Low Earth Ascent**: T+00:00 to T+00:08:30 (Refueling Core Launch)
2. **Cryogenic Propellant Transfer**: T+2 Days (Refilling LOX/CH4 Tanks)
3. **Trans-Mars Injection (TMI) Burn**: T+5 Days (Delta-V estimate: ~3.6 km/s)
4. **Heliocentric Cruise Phase**: 185 Earth Days
5. **Mars Aerocapture and Aerobraking**: Direct Entry and retro-propulsion touchdown

---

## 2. Atmospheric & Life Support Regimes
Mars atmospheric pressure sits at a fragile 0.6% of Earth's sea-level standard, composed primarily of Carbon Dioxide (95%). Survival requires immediate, automated, and fail-safe habitats extraction:

### Subsystem A: Oxygen Extraction (MOXIE-II)
Scaled models of high-temperature solid oxide electrolysis split CO2 molecules into gaseous O2 and Carbon Monoxide:
$$2CO_2 \rightarrow 2CO + O_2$$
A battery of six industrial MOXIE-II modules will operate at $800^\circ\text{C}$ to produce $12\text{ kg}$ of pure breathing oxygen per hour, storing compressed breathing reserves before astronaut arrival.

### Subsystem B: Regolith Shielding
To prevent acute radiation events from galactic cosmic rays (GCR) and solar particle events (SPE), our automated robotic rovers will print sintered regolith domes over inflatable landing modules, providing $1.5\text{ meters}$ of solid, basaltic debris insulation.

---

## 3. Automated Agriculture & Sub-Surface Core Drilling
Liquid water has been identified as deep sub-surface glaciers spanning Utopia Planitia:
* **Drilling Depth Requirements:** $15\text{ to }45\text{ meters}$
* **Purification Cycle:** Filtration of heavy perchlorate salts via reverse osmosis
* **Crop Growth Profile:** Hydroponic chambers utilizing custom tailored LED light patterns. High-yield crops including sweet potatoes, spirulina algae, and dwarf wheat.

All telemetry and mission schedules are persistent across this device storage for local mission survival reference.`
  },
  "cosmology": {
    title: "Introduction to Stellar Astrophysics & Dark Matter",
    content: `# Introduction to Stellar Astrophysics & Dark Matter

## Course Syllabus (AST-402)
**Department of Astrophysics & Planetary Sciences**  
**Pre-requisites:** General Relativity, Intermediate Quantum Dynamics.

---

## Abstract
Modern cosmology lies at the intersection of general relativity, quantum mechanics, and observational particle physics. This lecture outline details the primary structural evidence supporting the Lambda-Cold Dark Matter ($\Lambda\text{CDM}$) model, cosmic microwave background (CMB) fluctuations, and galactic rotational curves.

---

## 1. Galactic Rotation Curves
The strongest localized evidence for dark matter comes from the study of the rotational velocities of spiral galaxies.

According to Newtonian mechanics, the velocity of a star orbitting at distance $r$ from the galactic core is given by:

$$v(r) = \sqrt{\frac{G M(r)}{r}}$$

Where $M(r)$ is the cumulative mass enclosed within radius $r$. For stars far outside the central luminous bulge, we expect:
* Luminous density drops exponentially
* $M(r)$ should approach a constant value
* Therefore, velocity $v(r)$ should fall off proportionally as $r^{-1/2}$

However, observational measurements (originally compiled by Vera Rubin in the 1970s) demonstrate that galactic rotational curves remain **remarkably flat** out to extreme distances:

$$\lim_{r \to \infty} v(r) = \text{Constant}$$

This flat velocity profile implies the presence of a vast, non-luminous mass distribution — a **Dark Matter Halo** — extending far beyond the visible boundaries of galactic disks, containing up to 85% of the total mass of the galaxy.

---

## 2. Cosmic Microwave Background (CMB) Anisotropies
The CMB represents the oldest electromagnetic radiation in the universe, originating approximately $380,000$ years after the Big Bang, during the era of recombination when neutral hydrogen atoms first formed:

* **Mean Temperature:** $2.72548 \pm 0.00057\text{ K}$
* **Fluctuation Resolution:** $\Delta T / T \approx 10^{-5}$

The power spectrum of these temperature fluctuations contains acoustic peaks reflecting density oscillations in the early hot plasma. The specific height and spacing of these peaks provide precise bounds on baryon density and dark matter density:

| Cosmic Component | Abundance Percentage ($\Omega$) |
| :--- | :--- |
| **Baryonic Matter (Stars, Planets, Dust)** | ~4.9% |
| **Cold Dark Matter (CDM)** | ~26.8% |
| **Dark Energy ($\Lambda$)** | ~68.3% |

---

## 3. Dark Matter Candidates
* **WIMPs (Weakly Interacting Massive Particles):** Supersymmetric partners, neutralinos. Still the leading candidate for subterranean liquid xenon detector experiments.
* **Axions:** Extremely light, hypothetical particles designed to solve the strong CP problem in quantum chromatodynamics (QCD).
* **Primordial Black Holes (PBHs):** Gravitational micro-collapses formed during cosmic inflation.

This lecture note is stored offline for study on planetary surfaces where satellite link is unavailable.`
  },
  "offline-cookbook": {
    title: "Offline Web Applications Handbook",
    content: `# Offline Web Applications Handbook

Modern progressive web apps (PWAs) treat offline functionality not as a nice fallback, but as an essential design pattern. Designing for offline-first ensures that your application is reliable, responsive, and resilient under poor network conditions (the dreading "Lie-Fi" effect).

## 1. Local Storage vs. IndexedDB vs. Cache Storage
Each browser-side storage mechanism serves a precise, architectural purpose:

| Feature | LocalStorage | IndexedDB | Cache API |
| :--- | :--- | :--- | :--- |
| **Core Purpose** | Simple key-value configs | Complex structured data | Static HTTP payloads |
| **Data Types** | Strings (JSON serialized) | Binary blobs, files, JSON | Request/Response objects |
| **Storage Limit** | ~5MB per origin | ~50% of free system space | Large, dynamic storage |
| **API Style** | Synchronous, blocking | Asynchronous (promises) | Promise-based |

## 2. The Service Worker Lifecycle
A Service Worker is a specialized background script that acts as an intersection proxy between network calls and cache resources.

\`\`\`javascript
// Registering a Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW Registered successfully:', reg.scope))
      .catch(err => console.error('SW Registration failing:', err));
  });
}
\`\`\`

### Lifecycle Steps
1. **Install Event**: Fired when the service worker is loaded. It is here that we "pre-cache" our core HTML shell, CSS sheets, logo graphics, and static scripts.
2. **Activate Event**: Old service worker files are terminated, and newly installed workers can purge outdated caches.
3. **Fetch Event**: Every asset requested by the client travels through this event interceptor, where we can choose to serve immediately from cache or route to network.

## 3. Cache Fallback Strategies
* **Cache-First (Static Assets)**: Check cache. Cache matches? Return it immediately. Otherwise, fetch from network and dynamically store it for later. Great for logos, fonts, CSS files.
* **Network-First (Dynamic Data)**: Force-fetch from active network. If connection fails, serve stale-cached data. Great for dashboards, article directories, or live feeds.
* **Stale-While-Revalidate (Asset Updates)**: Instantly serve from local cache, while running a silent network request in the background to refresh local storage for the next visit. Extremely responsive!

This compilation teaches all the standards you need to handle offline capabilities!`
  },
  "tech-news-digest": {
    title: "Daily Global Tech Headlines Digest",
    content: `# Daily Global Tech Headlines Digest

**Publication Date:** June 21, 2026.  
**Curation:** Autonomous Newsroom Aggregate Engine.  

---

## 1. Breakthrough in Silicon-Photonic Processors
Researchers at the Zurich Institute of Nanotechnology have unveiled the first monolithic silicon-photonic CPU capable of processing **1.2 ExaOPS** of artificial intelligence calculations while operating under standard room temperatures. By using lithium-niobate micro-lasers etched directly onto a standard 2nm silicon wafer, they completely bypass the resistive thermal bottlenecks inherent in standard electrical copper pathways.
* **Efficiency Boost:** 85% energy footprint reduction compared to current graphics computing hardware.
* **Commercialization Timeline:** Alpha shipments to server clusters slated for Q3 2027.

---

## 2. Dynamic Solid-State Battery Commercialization
A consortium of electric vehicle manufacturers has completed pre-production lines for lithium-metal solid-state batteries in Yokohama, Japan.
* **Energy Density:** $480\text{ Wh/kg}$ (nearly double the current top-tier EV cells).
* **Charging Velocity:** 10% to 80% charge achieved in exactly **4.5 minutes** from a high-yield megawatt grid connector.
* **Thermal Profile:** Solid ceramic separator entirely eliminates thermodynamic runaway risk, preventing fire risks during severe collisions.

---

## 3. W3C Finalizes Cryptography Standard for Quantum-Resistant Web
The World Wide Web Consortium (W3C) has officially published the **Web Quantum Cryptography Suite (WQCS) 1.0**. 

This protocol mandates that all commercial transport layer security (TLS) configurations incorporate lattice-based key-exchange processes (such as Kyber-1024) to safeguard current communications against future supercomputing decryption risks (known as *Harvest Now, Decrypt Later*).
The suite will be integrated into all major engines (Chromium, Gecko, WebKit) starting immediately.

*All digests are saved to local cache for your morning commute reading.*`
  },
  "clean-code": {
    title: "Pragmatic Senior Engineer Architectural Guidelines",
    content: `# Pragmatic Senior Engineer Architectural Guidelines

Crafting scalable software requires strict, disciplined design. This handbook condenses modularity rules, error handling workflows, and decoupling paradigms.

## 1. Single Responsibility Principle (SRP)
A class, model, or helper module must have exactly **one reason to change**.

* **Bad Practice**: A single function that fetches a user profile API, parses JSON, writes it directly into the DOM, and fires a tracking telemetry analytics event.
* **Good Practice**: Create three distinct layers:
  1. API Gateway Client (\`fetchUserData\`)
  2. Data Parsing / Transformation Service (\`userProfileMapper\`)
  3. Presentation Layer / Render Components (\`UserProfileCard\`)

## 2. Decoupled Interface-Driven Design
Do not couple high-level business workflow logic to concrete data persistence drivers. Make use of adapters:

\`\`\`ts
// Defy tight coupling using Interfaces
interface StorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
}

// Low-level LocalStorage Implementation
class LocalStorageAdapter implements StorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
\`\`\`

By writing services that accept *any* object following the \`StorageAdapter\` interface, you can easily swap out LocalStorage with CouchDB, IndexedDB, or Firestore down the road without rewriting a single line of business code.

## 3. The "Fail-Fast" and "No-Empty-Catch" Rule
Never swallow exceptions under any circumstances. If a catch block exists, it must either resolve the system state into a valid backup route or log and throw.

* **Anti-Pattern**:
  \`\`\`ts
  try {
    saveData();
  } catch (error) {
    // Empty catch! App fails silently and user loses data.
  }
  \`\`\`

* **Pragmatic Pattern**:
  \`\`\`ts
  try {
    saveData();
  } catch (error: any) {
    logger.error("Failed to persist content, switching to local state cache.", error);
    toastNotification.show("Saving failed. Storing to temporary memories instead.");
    this.fallbackLocalMemory.save(data);
  }
  \`\`\`

Adhering to these clean standards guarantees system survival! Read this guideline offline to align with core architectural craftsmanship.`
  }
};
