import { treaty } from '@elysiajs/eden'
import type { App } from '../app/api/[[...slugs]]/route'

export const client = treaty<App>('https://realtime-chat-app-eosin-mu.vercel.app/').api
