# Discord.cat - Discord Message Analytics Platform

## Overview

Discord.cat is a full-stack web application designed for advanced Discord message exploration and analytics. The platform allows users to search and filter indexed Discord messages stored in Elasticsearch, providing insights into conversations, user activity, and server dynamics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Bundler**: Vite with custom configuration
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider with light/dark mode toggle

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **API Design**: RESTful endpoints for search and statistics
- **Data Layer**: Direct Elasticsearch integration (no traditional database)
- **External APIs**: Discord API integration for user data

### UI/UX Design Philosophy
- Clean, minimal design inspired by cursor.com and spy.pet
- No borders or boxes - airy, sleek, flat layout
- Smooth hover transitions and animations
- Responsive design with mobile considerations

## Key Components

### Search System
- **Multi-field Search**: Content, author ID, channel ID, guild ID
- **Pagination**: 50 messages per page with navigation
- **Sorting**: Timestamp ascending/descending options
- **Real-time Results**: Instant search with loading states

### Statistics Dashboard
- **Animated Counters**: 5-second increment animations
- **Metrics Tracked**: Total messages, unique users, unique guilds
- **Real-time Data**: Live statistics from Elasticsearch

### User Integration
- **Discord User Data**: Avatar and username resolution
- **Caching Strategy**: In-memory user data caching
- **Fallback System**: Graceful degradation when Discord API unavailable

### Theme System
- **Dual Themes**: Light (default) and dark mode
- **Persistent Settings**: LocalStorage theme preference
- **CSS Variables**: Dynamic theme switching via CSS custom properties

## Data Flow

### Search Flow
1. User enters search criteria in SearchInterface component
2. Filters validated using Zod schemas
3. Request sent to `/api/search` endpoint
4. ElasticsearchService queries multiple indices (chunk1-chunk5)
5. Results processed and returned with pagination metadata
6. SearchResults component renders messages with user data

### Statistics Flow
1. Homepage loads and triggers stats query
2. Backend aggregates data across all Elasticsearch indices
3. AnimatedCounter components animate from 0 to actual values
4. Statistics update in real-time

### User Data Flow
1. Message results contain author IDs
2. Frontend batches user ID requests
3. Backend checks cache first, then Discord API
4. User avatars and usernames displayed with messages
5. Fallback to generic user data if API fails

## External Dependencies

### Core Dependencies
- **Elasticsearch**: Cloud-hosted search engine for message storage
- **Discord API**: User data retrieval (avatar, username)
- **Neon Database**: PostgreSQL for potential future features
- **Radix UI**: Accessible component primitives

### Development Tools
- **Drizzle**: Database toolkit (configured for future PostgreSQL use)
- **ESBuild**: Production bundling for server
- **TypeScript**: Type safety across the stack

### Cloud Services
- **Elasticsearch Cloud**: Managed Elasticsearch with authentication
- **Replit**: Development and hosting platform

## Deployment Strategy

### Build Process
- **Client**: Vite builds React app to `dist/public`
- **Server**: ESBuild bundles Express server to `dist/index.js`
- **Type Checking**: TypeScript compilation without emit

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection (for future use)
- **ELASTICSEARCH_CLOUD_ID**: Elasticsearch cluster identifier
- **ELASTICSEARCH_USERNAME/PASSWORD**: Authentication credentials
- **DISCORD_BOT_TOKEN**: Optional Discord API access

### Production Setup
- **Static Assets**: Served from `dist/public`
- **API Routes**: Express server handles `/api/*` endpoints
- **Fallback Routing**: SPA routing with Express fallback

### Development Features
- **Hot Reload**: Vite HMR for fast development
- **Error Overlay**: Runtime error display in development
- **Logging**: Structured request/response logging
- **CORS**: Development-friendly configuration

### Performance Optimizations
- **Code Splitting**: Vite automatic code splitting
- **Asset Optimization**: Vite handles asset optimization
- **Caching**: User data caching reduces API calls
- **Pagination**: Efficient data loading with 50-item pages

The application follows modern web development practices with a focus on performance, accessibility, and user experience while maintaining a clean, minimal aesthetic that prioritizes content discovery and exploration.