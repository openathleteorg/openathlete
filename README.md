<p align="center">
  <a href="https://openathlete.org">
    <img src="doc/imgs/readme-hero.webp" alt="OpenAthlete: serious endurance training, without the subscription">
  </a>
</p>

<h3 align="center">Serious endurance training. Without the subscription.</h3>

<p align="center">
  The open-source training platform for runners, trail runners, triathletes, cyclists and their coaches.
  <br />
  Plan your season, send structured workouts to your watch, see what every session did to your fitness.
  <br />
  <br />
  <a href="https://app.openathlete.org/auth/create-account"><strong>Create a free account »</strong></a>
  <br />
  <br />
  <a href="https://openathlete.org">Website</a>
  ·
  <a href="https://docs.openathlete.org">Documentation</a>
  ·
  <a href="https://docs.openathlete.org/docs/getting-started/self-hosting">Self-hosting</a>
  ·
  <a href="https://discord.gg/j4PP6tDwuP">Discord</a>
  ·
  <a href="https://api.openathlete.org/docs">API</a>
</p>

<p align="center">
   <a href="https://github.com/openathleteorg/openathlete/stargazers"><img src="https://img.shields.io/github/stars/openathleteorg/openathlete" alt="GitHub stars"></a>
   <a href="https://github.com/openathleteorg/openathlete/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-purple" alt="License"></a>
   <a href="https://github.com/openathleteorg/openathlete/releases"><img src="https://img.shields.io/github/v/release/openathleteorg/openathlete" alt="Latest release"></a>
   <a href="https://github.com/openathleteorg/openathlete/pulse"><img src="https://img.shields.io/github/commit-activity/m/openathleteorg/openathlete" alt="Commits per month"></a>
   <a href="https://testflight.apple.com/join/1hBg4mR1"><img src="https://img.shields.io/badge/iOS-TestFlight-blue" alt="iOS on TestFlight"></a>
   <a href="https://discord.gg/j4PP6tDwuP"><img src="https://img.shields.io/badge/Discord-Community-5865F2" alt="Discord"></a>
   <a href="https://buymeacoffee.com/openathlete"><img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?logo=buymeacoffee&logoColor=black" alt="Buy Me a Coffee"></a>
</p>

## Why OpenAthlete

Training platforms keep years of your data, charge coaches per athlete, and can be bought or shut down. Today's Plan closed in 2024; TrainingPeaks has belonged to Garmin since July 2026.

OpenAthlete is free on our servers in France and free on yours. The code is public under AGPL-3.0, the training-load formulas are in this repository, and you can export everything at any time. It is built by an independent developer and ultra runner in Grenoble, with no investors.

## What it does

<img src="doc/imgs/readme-plan.webp" alt="Training calendar on desktop and phone">

**Plan.** A calendar that thinks in seasons, weeks and sessions: training blocks, A/B/C races, illness and travel periods that move the sessions they cover, whole weeks copied or shifted with undo, and a calendar feed for Google, Apple or Outlook.

**Build and sync.** Structured workouts with targets from your own zones (pace, power, heart rate, % of VMA or FTP), a reusable library, and delivery to **Garmin, COROS and Suunto** watches at the next sync.

<img src="doc/imgs/readme-analyse.webp" alt="Activity analysis with the AI read of the session">

**Analyse.** Activities from **Garmin, COROS, Suunto, Polar and Strava**, or FIT, GPX and TCX files. Each interval graded against the plan, detected climbs, time in zones, aerobic decoupling, pace adjusted for gradient and weather, and non-destructive fixes for heart-rate spikes.

<img src="doc/imgs/readme-progress.webp" alt="Records and recovery metrics">

**Progress.** Records by distance and duration, year against year; critical speed and power; fitness, fatigue and form (CTL, ATL, TSB) from heart rate or perceived effort, projected over your planned sessions; HRV, resting heart rate and sleep from your watch. Every metric says what it measures and where it stops being reliable.

<img src="doc/imgs/readme-coach.webp" alt="Coach dashboard and coach–athlete messages">

**Coach.** Compliance, volume and form for every athlete on one screen, alerts for reported pain, inactivity and unread messages, planning for several athletes at once, comments and real-time chat. Five athletes free, unlimited with Supporter.

**AI, on your terms.** Generate or edit a session from a sentence, get a short read of each activity and three questions on how it felt. Bring your own key (OpenAI, Anthropic, Google, Mistral, OpenRouter, DeepSeek, xAI, Groq, or a local model when self-hosted), pick the model per feature, or use the allowance included with Supporter. Nothing reaches an AI provider until you allow it. An **MCP server** lets Claude, ChatGPT or Cursor read your training and plan sessions straight into your calendar.

**Mobile.** The web app is built for phones and installs on the home screen. iOS and Android apps are in testing ([TestFlight](https://testflight.apple.com/join/1hBg4mR1)).

## How it compares

| | OpenAthlete | TrainingPeaks | intervals.icu | Strava |
| --- | --- | --- | --- | --- |
| Open source, self-hostable | ✅ AGPL-3.0 | ❌ | ❌ | ❌ |
| Planned workouts sent to the watch | ✅ Free (Garmin, COROS, Suunto) | Premium only | ✅ | ❌ |
| Fitness / fatigue / form | ✅ Formulas in the code | ✅ | ✅ | Subscription |
| AI | Your key, or included with Supporter; MCP server | — | Connector (Supporter) | — |
| Coaching | 5 athletes free, unlimited €50/yr | From $21.99/mo + per-athlete fees | Supporter | — |
| Athlete price | Free (Supporter €5/mo or €50/yr, optional) | $19.95/mo or $134.99/yr | Free ($4/mo Supporter) | €59.99/yr |

Prices from each vendor's pricing page, checked on 3 November 2026 (USD before tax). Detailed, sourced comparisons: [openathlete.org/compare](https://openathlete.org/compare).

## Built with

React 19 and Vite (web, with Capacitor for iOS and Android), NestJS 11 with BullMQ jobs and Mastra agents (API), Prisma and PostgreSQL with pgvector, Redis, Next.js (website), Paraglide (6 languages), Tailwind CSS.

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running, please follow these simple steps.

### Prerequisites

Here is what you need to be able to run OpenAthlete.

- **Node.js** (Version: >=22.14.0) - We recommend using [nvm](https://github.com/nvm-sh/nvm) for version management
- **pnpm** (Version: >=9.x) - Fast, disk space efficient package manager
- **PostgreSQL** (Version: >=13.x) - Database
- **Git** - Version control

> If you want to enable AI features, you may need to obtain API credentials. More details can be found in the [documentation](https://docs.openathlete.org).

## Development

### Setup

```sh
git clone https://github.com/openathleteorg/openathlete.git
cd openathlete
nvm use && pnpm install

# PostgreSQL (with pgvector) and Redis
docker compose -f docker-compose.dev.yml up -d

# Environment files, then edit them if needed
for f in apps/api apps/web libs/database; do cp $f/.env.example $f/.env; done

# Prisma client, shared package, database
pnpm database run db:generate && pnpm shared build && pnpm database run db:deploy

pnpm dev   # API on http://localhost:3000, web app on http://localhost:5173
```

Run the same checks as CI with `scripts/verify.sh` (add `--integration`, `--build` or `--e2e` for the slower suites).

### Development Tips

1. Run type checking before committing:

   ```sh
   pnpm tsc:check
   ```

2. Format and lint your code:

   ```sh
   pnpm format:write
   pnpm lint:fix
   ```

### Upgrading from earlier versions

1. Pull the current version:

   ```sh
   git pull
   ```

2. Check if dependencies got added/updated/removed

   ```sh
   pnpm install
   ```

3. Apply database migrations by running <b>one of</b> the following commands:

   In a development environment, run:

   ```sh
   pnpm database run db:migrate dev
   ```

   In a production environment, run:

   ```sh
   pnpm database run db:deploy
   ```

4. Check for `.env` variables changes

   Compare your `.env` files with the `.env.example` files to see if new variables were added.

5. Start the server. In a development environment, just do:

   ```sh
   pnpm dev
   ```

   For a production build, run for example:

   ```sh
   pnpm build
   pnpm start
   ```

6. Enjoy the new version.

<!-- DEPLOYMENT -->

## Deployment

### Self-hosting with Docker

On any server with Docker and its Compose plugin:

```bash
curl -fsSL https://raw.githubusercontent.com/openathleteorg/openathlete/main/scripts/install.sh | sh
```

OpenAthlete then runs on `http://localhost` from the published images, with new random secrets in `openathlete/.env`. Add `-s -- --domain openathlete.example.org` to serve your domain over HTTPS with automatic certificates. Run the script again to update.

The [self-hosting guide](https://docs.openathlete.org/docs/getting-started/self-hosting) covers HTTPS, device sync, AI, backups and upgrades from older setups.

### Manual Deployment

For detailed deployment instructions, see our [self-hosting documentation](https://docs.openathlete.org/docs/getting-started/self-hosting).

#### Backend (NestJS)

1. Build the application:

   ```bash
   cd apps/api
   pnpm install
   pnpm build
   ```

2. Set up environment variables in `.env`

3. Run database migrations:

   ```bash
   pnpm database run db:deploy
   ```

4. Start the server:

   ```bash
   pnpm start:prod
   ```

#### Frontend (React + Vite)

1. Build the application:

   ```bash
   cd apps/web
   pnpm install
   pnpm build
   ```

2. Serve the built files using a web server (nginx, Apache, etc.)

   Example nginx configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /path/to/apps/web/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

### Environment Variables

#### Backend Required Variables

```properties
DATABASE_URL="postgresql://user:password@host:5432/openathlete"
REDIS_URL="redis://host:6379"
JWT_SECRET_KEY="generate with: openssl rand -base64 32"
HASH_PEPPER="generate with: openssl rand -base64 32"
NODE_ENV="production"
```

#### Frontend Required Variables

```properties
VITE_API_BASE_URL="https://api.your-domain.com"
```

For a complete list of environment variables, see the `.env.example` files in each app directory.

## Support OpenAthlete

> OpenAthlete is built by one developer in Grenoble, supported by the community. There are three ways to help the project thrive:
>
> - **Become a Supporter** on [openathlete.org](https://openathlete.org/pricing): €5/month or €50/year. It pays for the servers and adds AI on our keys and unlimited coached athletes.
> - **Buy a coffee**: one-off support, even if you self-host. [buymeacoffee.com/openathlete](https://buymeacoffee.com/openathlete).
> - **Contribute**: star the repo, open issues, send pull requests, translate, or join the [Discord](https://discord.gg/j4PP6tDwuP).
>
> Self-hosting is fully supported and always free, with no limits. Supporters fund the project's long-term sustainability.

<!-- ROADMAP -->

## Roadmap

OpenAthlete is actively developed. Here's what's coming next:

- 🧩 **Modular Training Logic** - Custom goals, coach import, and flexible training methodologies
- 📈 **Enhanced Dashboards** - Intuitive data visualizations and performance analytics
- 🔗 **More Integrations** - Wahoo, Zwift, Oura, and more
- 👥 **Clubs** - Club accounts with several coaches and groups
- 📱 **Native apps** - iOS and Android apps in the stores

See our [GitHub Issues](https://github.com/openathleteorg/openathlete/issues) for a detailed list of proposed features and known issues.

<!-- LICENSE -->

## License

Distributed under the [AGPLv3 License](https://github.com/openathleteorg/openathlete/blob/main/LICENSE). See `LICENSE` for more information.

<!-- CONTRIBUTING -->

## Contributing

Please see our [contributing guide](/CONTRIBUTING.md).

### Good First Issues

We have a list of [good first issues](https://github.com/openathleteorg/openathlete/issues?q=is:issue+is:open+label:%22good+first+issue%22) that contain small features and bugs which have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.

### Help Wanted

We also have [help wanted](https://github.com/openathleteorg/openathlete/issues?q=is:issue+is:open+label:%22help+wanted%22) issues that are perfect for contributors looking to make a bigger impact.

### Contributors

<a href="https://github.com/openathleteorg/openathlete/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=openathleteorg/openathlete" />
</a>

### Translations

Don't code but still want to contribute? Join our [Discord community](https://discord.gg/j4PP6tDwuP) and help translate OpenAthlete into your language.

## Repo Activity

<img width="100%" src="https://repobeats.axiom.co/api/embed/99c5ba879a6c63bdd522bb53ca2a134a080a0a4b.svg" />

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

Special thanks to these amazing projects which help power OpenAthlete:

- [React](https://react.dev/)
- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Vite](https://vitejs.dev/)
- [PostgreSQL](https://www.postgresql.org/)

---

<p align="center">
  Made with ❤️ by athletes, for athletes
</p>

<p align="center">
  If you self-host OpenAthlete, a <a href="https://buymeacoffee.com/openathlete">coffee</a> helps keep it maintained.
</p>
