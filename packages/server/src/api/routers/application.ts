import { Router } from 'express';

// Authentication
import login from '@app/routes/authentication/login';
import logout from '@app/routes/authentication/logout';
import profileInfo from '@app/routes/authentication/profile-info';
import register from '@app/routes/authentication/register';
import reset from '@app/routes/authentication/reset';
import sendReset from '@app/routes/authentication/send-reset';
import userInfo from '@app/routes/authentication/user-info';
import userUpdate from '@app/routes/authentication/user-update';

// Application
import init from '@app/routes/application/init';

// Subscription
import activateCode from '@app/routes/subscription/activate-code';
import billings from '@app/routes/subscription/billings';
import captureSubscription from '@app/routes/subscription/capture-subscription';
import revalidateSubscription from '@app/routes/subscription/revalidate-subscription';
import plans from '@app/routes/subscription/plans';
import subscriptionInfo from '@app/routes/subscription/subscription-info';

// Paypal Subscription
import cancelSubscription from '@app/routes/subscription/paypal/cancel-subscription';
import createSubscription from '@app/routes/subscription/paypal/create-subscription';
import suspendSubscription from '@app/routes/subscription/paypal/suspend-subscription';
import updateSubscription from '@app/routes/subscription/paypal/update-subscription';
import activateSubscription from '@app/routes/subscription/paypal/activate-subscription';
import paypalOneTimeCreate from '@app/routes/subscription/paypal/one-time-create';

// Stripe Subscription
import stripeCreateSubscription from '@app/routes/subscription/stripe/create-subscription';
import stripeCancelSubscription from '@app/routes/subscription/stripe/cancel-subscription';
import stripeResumeSubscription from '@app/routes/subscription/stripe/resume-subscription';
import stripeUpdateSubscription from '@app/routes/subscription/stripe/update-subscription';
import stripeOneTimeCreate from '@app/routes/subscription/stripe/one-time-create';

// Films (Unified Movies & Series)
import filmsActivities from '@app/routes/films/activities';
import filmsBookmarks from '@app/routes/films/bookmarks';
import filmsCategories from '@app/routes/films/categories';
import filmsDetails from '@app/routes/films/details';
import filmsDiscover from '@app/routes/films/discover';
import filmsEpisodes from '@app/routes/films/episodes';
import filmsGenres from '@app/routes/films/genres';
import filmsPopular from '@app/routes/films/popular';
import filmsRecently from '@app/routes/films/recently';
import filmsRecommendation from '@app/routes/films/recommendation';
import filmsSearch from '@app/routes/films/search';
import filmsTopRated from '@app/routes/films/top-rated';
import filmsTrailer from '@app/routes/films/trailer';
import filmsTrending from '@app/routes/films/trending';

// Channels (IPTV.org - Live TV Streaming)
import channelsActivities from '@app/routes/channels/activities';
import channelsBookmarks from '@app/routes/channels/bookmarks';
import channelsCategories from '@app/routes/channels/categories';
import channelsCountries from '@app/routes/channels/countries';
import channelsSearch from '@app/routes/channels/search';
import channelDetails from '@app/routes/channels/details';

// Personalized
// import personalizedActivities from '@app/routes/personalized/activities/activities';
import addMovieActivity from '@app/routes/personalized/activities/add-movie-activity';
import addSerieActivity from '@app/routes/personalized/activities/add-serie-activity';
import addChannelActivity from '@app/routes/personalized/activities/add-channel-activity';
import removeChannelActivity from '@app/routes/personalized/activities/remove-channel-activity';

// import personalizedBookmarks from '@app/routes/personalized/bookmarks/bookmarks';
import addBookmark from '@app/routes/personalized/bookmarks/add-bookmark';
import removeBookmark from '@app/routes/personalized/bookmarks/remove-unbookmark';
import addChannelBookmark from '@app/routes/personalized/bookmarks/add-channel-bookmark';
import removeChannelBookmark from '@app/routes/personalized/bookmarks/remove-channel-bookmark';

import addProfile from '@app/routes/personalized/profiles/add-profile';
import avatars from '@app/routes/personalized/profiles/avatars';
import removeProfile from '@app/routes/personalized/profiles/remove-profile';
import updateProfile from '@app/routes/personalized/profiles/update-profile';

// Helpers & Middlewares
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { rateLimiterMiddleware } from '@api/middlewares/rate-limiters';
import { SubscriptionMiddleware } from '@api/middlewares/subscription';
import { AuthorizationMiddleware } from '@api/middlewares/authentications';
import { ValidateMediaType } from '@api/middlewares/media-type';

// Initialize router
const router = Router();

// Configure rate limiting for general API requests
const apiLimiter = new RateLimiterMemory({
	points: 150, // Limit to 50 requests
	duration: 15, // Per 15 seconds by IP
});

// Apply API rate limiting middleware
router.use(rateLimiterMiddleware(apiLimiter));

////
//// Public Routes
////
router.use('/init', init);
router.use('/personalized/profiles/avatars', avatars);
router.use('/auth/login', login);
router.use('/auth/send-reset', sendReset);
router.use('/auth/logout', logout);
router.use('/auth/register', register);
router.use('/auth/reset', reset);

/////
////
//// Protected Routes
////
////
//// Apply Authorization Middleware
router.use(AuthorizationMiddleware);

// Authentication Routes
router.use('/auth/user-info', userInfo);
router.use('/auth/profile-info', profileInfo);
router.use('/auth/user-update', userUpdate);

// Subscription Routes
router.use('/subscription/activate-code', activateCode);
router.use('/subscription/billings', billings);
router.use('/subscription/capture', captureSubscription);
router.use('/subscription/revalidate', revalidateSubscription);
router.use('/subscription/plans', plans);
router.use('/subscription/info', subscriptionInfo);

// Paypal Routes
router.use('/subscription/paypal/cancel', cancelSubscription);
router.use('/subscription/paypal/create', createSubscription);
router.use('/subscription/paypal/suspend', suspendSubscription);
router.use('/subscription/paypal/update', updateSubscription);
router.use('/subscription/paypal/activate', activateSubscription);
router.use('/subscription/paypal/one-time/create', paypalOneTimeCreate);

// Stripe Routes
router.use('/subscription/stripe/create', stripeCreateSubscription);
router.use('/subscription/stripe/cancel', stripeCancelSubscription);
router.use('/subscription/stripe/resume', stripeResumeSubscription);
router.use('/subscription/stripe/update', stripeUpdateSubscription);
router.use('/subscription/stripe/one-time/create', stripeOneTimeCreate);

// Channels Routes (Live TV / IPTV.org Integration) - Must be before /:type routes to prevent matching as /:type pattern
router.use('/channels/activities', channelsActivities);
router.use('/channels/bookmarks', channelsBookmarks);
router.use('/channels/categories', channelsCategories);
router.use('/channels/countries', channelsCountries);
router.use('/channels/search', channelsSearch);
router.use('/channels/details', channelDetails);

// Films Routes (/:type pattern - movies|series)
router.use('/:type/search', ValidateMediaType, SubscriptionMiddleware, filmsSearch);
router.use('/:type/trailer', ValidateMediaType, filmsTrailer);
router.use('/:type/watching', ValidateMediaType, filmsActivities);
router.use('/:type/bookmarked', ValidateMediaType, filmsBookmarks);
router.use('/:type/categories', ValidateMediaType, filmsCategories);
router.use('/:type/details', ValidateMediaType, filmsDetails);
router.use('/:type/discover', ValidateMediaType, filmsDiscover);
router.use('/:type/episodes', ValidateMediaType, filmsEpisodes);
router.use('/:type/genres', ValidateMediaType, filmsGenres);
router.use('/:type/popular', ValidateMediaType, filmsPopular);
router.use('/:type/recently', ValidateMediaType, filmsRecently);
router.use('/:type/recommendation', ValidateMediaType, filmsRecommendation);
router.use('/:type/top-rated', ValidateMediaType, filmsTopRated);
router.use('/:type/trending', ValidateMediaType, filmsTrending);

// Personalized Routes
// router.use('/personalized/activities', Sub.scriptionMiddleware, personalizedActivities); => Not optimized will loop through all bookmarks and fetch details via TMDB API
router.use('/personalized/activities/movie', SubscriptionMiddleware, addMovieActivity);
router.use('/personalized/activities/serie', SubscriptionMiddleware, addSerieActivity);
router.use('/personalized/activities/add-channel', SubscriptionMiddleware, addChannelActivity);
router.use('/personalized/activities/remove-channel', SubscriptionMiddleware, removeChannelActivity);
// Bookmarks
// router.use('/personalized//bookmarks', SubscriptionMiddleware, personalizedBookmarks); => Not optimized will loop through all bookmarks and fetch details via TMDB API
router.use('/personalized/bookmarks/add/channels', SubscriptionMiddleware, addChannelBookmark);
router.use('/personalized/bookmarks/remove/channels', SubscriptionMiddleware, removeChannelBookmark);
router.use('/personalized/bookmarks/add', SubscriptionMiddleware, addBookmark);
router.use('/personalized/bookmarks/remove', SubscriptionMiddleware, removeBookmark);
// Profiles
router.use('/personalized/profiles/add', SubscriptionMiddleware, addProfile);
router.use('/personalized/profiles/remove', SubscriptionMiddleware, removeProfile);
router.use('/personalized/profiles/update', SubscriptionMiddleware, updateProfile);
export default router;
