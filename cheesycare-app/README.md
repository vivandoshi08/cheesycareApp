# CheesyCare App

This is a Next.js project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, navigate to the project directory:

```bash
cd cheesycare-app
```

Install dependencies:

```bash
npm install
# or
yarn
# or
pnpm install
# or
bun install
```

## Setting up Supabase

This application uses Supabase as its database backend. You'll need to set up a Supabase project and configure the environment variables:

1. Create a Supabase project at [https://supabase.com](https://supabase.com) if you don't have one already
2. Create a `.env.local` file in the root of the project with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Replace the placeholder values with your actual Supabase project credentials (found in your Supabase project settings)

4. Import the database schema into your Supabase project by copying the SQL from `src/lib/database.sql` and running it in the Supabase SQL editor

## Running the Development Server

After setting up Supabase, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Building the Application

To build the application for production, run:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

## Starting the Production Server

To start the production server, run:

```bash
npm start
# or
yarn start
# or
pnpm start
# or
bun start
```
