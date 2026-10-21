import { landingRouter } from './landingRouter';
import { appRouter } from './appRouter';
import { isLandingSubdomain } from '../utils/subdomainNav';

/**
 * Dynamic Router Selector
 * Evaluates the current hostname (or dev override) once at boot:
 *  - monitormyhost.com -> landingRouter (Landing page + Demos)
 *  - webpulse.monitormyhost.com -> appRouter (Login + App + Tools)
 */
export const router = isLandingSubdomain() ? landingRouter : appRouter;

export default router;
