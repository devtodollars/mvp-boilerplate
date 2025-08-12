# Next.js Production Boilerplate

This repository is an adapted version of <https://github.com/vercel/nextjs-subscription-payments>

## Demo

- <https://nextjs.devtodollars.com/>

## Getting Started

1. [Install node](https://nodejs.org/en/download)
2. In your terminal, run the following commands:

```bash
git clone https://github.com/devtodollars/startup-boilerplate.git YOUR_APP_NAME
cd YOUR_APP_NAME
```

3. Use `.env` file from DevToDollars

```
cd nextjs
cp .env.example .env
```

4. Run the local development server

```
npm install
npm run dev
```

## Stack

- Next.JS (App Router)
- Typescript
- Tailwind

## TODO as Issues not configured yet

#### Currently working on Account page, viewing active, non active, saved, applied for listings + QUEUES

### Bugs

- Verify acount deletion deletes also the objects from buckets
- Privacy Policy and terms of conditions
- Creating user with existing email
- passowrd reset handling
- Notifications refresh
- Indicate which messages are read
- Make notifications and messages dropdowns bigger
- Cannot clear individual notifications anymore
- Messages notification takes time or needs refresh
- Make the map a bit bigger, maybe like the left-hand side
- Error when clicking on map with no property selected
- On mobile, going to view property from management dashboard
- Cannot scroll page when chat is open
- Mobile improvements needed
- Fix tripple get request when clicking an empty chat in the chat window

### MVP Features

#### WIP - Dominik

TODO

- Notifications Testing
- Chat read/unread fix chat top tab
- Reset Password and test Auth logging in and deletion

#### TODO

- ID verification

- Stripe set up
