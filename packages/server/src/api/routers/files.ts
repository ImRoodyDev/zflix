import express, { Router } from 'express';
import path from 'path';
import image from '@app/routes/media/image';
import optimizedImage from '@app/routes/media/optimized-image';
import teaser from '@app/routes/media/teaser';
 import { RateLimiterMemory } from 'rate-limiter-flexible';
import { rateLimiterMiddleware } from '@api/middlewares/rate-limiters';
import { SubscriptionMiddleware } from '@api/middlewares/subscription';
import { AuthorizationMiddleware, ImageAuthentication } from '@api/middlewares/authentications';

// Initialize router
const router = Router();
const apiPublicPath = path.join(process.cwd(), 'src', 'api', 'public');

// Configure rate limiting for media-related API requests
const mediaLimiter = new RateLimiterMemory({
	points: 260, // Limit to 260 requests
	duration: 10,
});

// Apply image rate limiting middleware
router.use(rateLimiterMiddleware(mediaLimiter));

////
//// Public Routes
////
// Serve logos directory only (restricted access)
router.use(
	'/images/logos',
	express.static(path.join(apiPublicPath, 'images', 'logos'), {
		maxAge: '30d',
		setHeaders: (res) => {
			res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
		},
	}),
);
router.use(
	'/images/payments',
	express.static(path.join(apiPublicPath, 'images', 'payments'), {
		maxAge: '30d',
		setHeaders: (res) => {
			res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
		},
	}),
);

/////
////
//// Protected Routes
////
////
 
//// Apply Authorization Middleware
router.use(ImageAuthentication);
router.use(
	'/images/avatars',
	express.static(path.join(apiPublicPath, 'images', 'avatars'), {
		maxAge: '30d',
		setHeaders: (res) => {
			res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
		},
	}),
);
router.use('/images/films', image);
router.use('/optimized-images', optimizedImage);
router.use('/teasers', SubscriptionMiddleware, teaser);

export default router;
