import path from 'path';
import fs from 'fs';
import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import appConfig from '@core/infrastructure/config/application';
import { AdminAuthentication } from '@api/middlewares/authentications';

// Load the pre-written OpenAPI document from the docs directory so the router stays lean
const swaggerDocumentPath = path.join(process.cwd(), 'src', 'api', 'public', 'docs', 'swagger.json');
let swaggerDocument: Record<string, unknown> = {};

try {
	swaggerDocument = JSON.parse(fs.readFileSync(swaggerDocumentPath, 'utf8'));
	swaggerDocument.servers = [
		{ url: process.env.SERVER_DOMAIN, description: 'Production server' },
		{ url: `http://localhost:${appConfig.PORT}`, description: 'Local development server' },
	];
} catch (err) {
	console.error('Unable to load Swagger document from', swaggerDocumentPath, err);
}

const router = Router();

// Protected routes (require admin authentication)
router.use(AdminAuthentication);
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, { explorer: true }));
router.get('/swagger.json', (req, res) => res.json(swaggerDocument));

export default router;
