import { Router } from 'express';
import { biometricController } from './controller';

const router = Router();

// Registration endpoints
router.post('/register-options', biometricController.getRegistrationOptions);
router.post('/register-verify', biometricController.verifyRegistration);

// Authentication endpoints
router.post('/login-options', biometricController.getAuthenticationOptions);
router.post('/login-verify', biometricController.verifyAuthentication);

// Credential management
router.get('/credentials', biometricController.getCredentials);
router.delete('/credentials/:id', biometricController.deleteCredential);

export default router;
