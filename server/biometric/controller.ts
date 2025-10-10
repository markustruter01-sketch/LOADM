import { Request, Response } from 'express';
import { db } from '../db';
import { webauthnCredentials, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

interface SessionData {
  currentChallenge?: string;
  authenticatingUserId?: number;
}

const RP_NAME = 'LOADMworkflow';
const RP_ID = process.env.RP_ID || 'localhost';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5000';

export const biometricController = {
  // Generate registration options for new biometric credential
  async getRegistrationOptions(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const userCredentials = await db
        .select()
        .from(webauthnCredentials)
        .where(eq(webauthnCredentials.userId, user.id));

      const opts: GenerateRegistrationOptionsOpts = {
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.email,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: userCredentials.map(cred => ({
          id: cred.credentialId,
          transports: ['internal'] as AuthenticatorTransport[],
        })),
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        supportedAlgorithmIDs: [-7, -257],
      };

      const options = await generateRegistrationOptions(opts);

      const session = req.session as any as SessionData;
      session.currentChallenge = options.challenge;

      return res.json(options);
    } catch (error) {
      console.error('Error generating registration options:', error);
      return res.status(500).json({ error: 'Failed to generate registration options' });
    }
  },

  // Verify registration response and store credential
  async verifyRegistration(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { credential, deviceName } = req.body;
      const session = req.session as any as SessionData;
      const expectedChallenge = session.currentChallenge;

      if (!expectedChallenge) {
        return res.status(400).json({ error: 'No challenge found in session' });
      }

      const opts: VerifyRegistrationResponseOpts = {
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      };

      const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse(opts);

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'Verification failed' });
      }

      const { credential: credInfo } = verification.registrationInfo;

      await db.insert(webauthnCredentials).values({
        userId: user.id,
        credentialId: credInfo.id,
        publicKey: Buffer.from(credInfo.publicKey).toString('base64url'),
        counter: credInfo.counter,
        deviceName: deviceName || 'Unknown Device',
      });

      delete session.currentChallenge;

      return res.json({ verified: true });
    } catch (error) {
      console.error('Error verifying registration:', error);
      return res.status(500).json({ error: 'Registration verification failed' });
    }
  },

  // Generate authentication options for login
  async getAuthenticationOptions(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userCredentials = await db
        .select()
        .from(webauthnCredentials)
        .where(eq(webauthnCredentials.userId, user.id));

      if (userCredentials.length === 0) {
        return res.status(404).json({ error: 'No biometric credentials found' });
      }

      const opts: GenerateAuthenticationOptionsOpts = {
        timeout: 60000,
        allowCredentials: userCredentials.map(cred => ({
          id: cred.credentialId,
          transports: ['internal'] as AuthenticatorTransport[],
        })),
        userVerification: 'required',
        rpID: RP_ID,
      };

      const options = await generateAuthenticationOptions(opts);

      const session = req.session as any as SessionData;
      session.currentChallenge = options.challenge;
      session.authenticatingUserId = user.id;

      return res.json(options);
    } catch (error) {
      console.error('Error generating authentication options:', error);
      return res.status(500).json({ error: 'Failed to generate authentication options' });
    }
  },

  // Verify authentication response and log user in
  async verifyAuthentication(req: Request, res: Response) {
    try {
      const { credential } = req.body;
      const session = req.session as any as SessionData;
      const expectedChallenge = session.currentChallenge;
      const userId = session.authenticatingUserId;

      if (!expectedChallenge || !userId) {
        return res.status(400).json({ error: 'No challenge or user found in session' });
      }

      const [dbCredential] = await db
        .select()
        .from(webauthnCredentials)
        .where(
          and(
            eq(webauthnCredentials.credentialId, credential.id),
            eq(webauthnCredentials.userId, userId)
          )
        );

      if (!dbCredential) {
        return res.status(404).json({ error: 'Credential not found' });
      }

      const opts: VerifyAuthenticationResponseOpts = {
        response: credential,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: dbCredential.credentialId,
          publicKey: Buffer.from(dbCredential.publicKey, 'base64url'),
          counter: dbCredential.counter,
        },
        requireUserVerification: true,
      };

      const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse(opts);

      if (!verification.verified) {
        return res.status(400).json({ error: 'Verification failed' });
      }

      await db
        .update(webauthnCredentials)
        .set({
          counter: verification.authenticationInfo.newCounter,
          lastUsedAt: new Date(),
        })
        .where(eq(webauthnCredentials.id, dbCredential.id));

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      (req as any).user = user;
      delete session.currentChallenge;
      delete session.authenticatingUserId;

      return res.json({
        verified: true,
        user: {
          id: user.id,
          email: user.email,
          isFirstLogin: user.isFirstLogin,
          role: user.userRole,
        },
      });
    } catch (error) {
      console.error('Error verifying authentication:', error);
      return res.status(500).json({ error: 'Authentication verification failed' });
    }
  },

  // Get user's biometric credentials
  async getCredentials(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const credentials = await db
        .select({
          id: webauthnCredentials.id,
          deviceName: webauthnCredentials.deviceName,
          createdAt: webauthnCredentials.createdAt,
          lastUsedAt: webauthnCredentials.lastUsedAt,
        })
        .from(webauthnCredentials)
        .where(eq(webauthnCredentials.userId, user.id));

      return res.json(credentials);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }
  },

  // Delete a biometric credential
  async deleteCredential(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      const [credential] = await db
        .select()
        .from(webauthnCredentials)
        .where(
          and(
            eq(webauthnCredentials.id, parseInt(id)),
            eq(webauthnCredentials.userId, user.id)
          )
        );

      if (!credential) {
        return res.status(404).json({ error: 'Credential not found' });
      }

      await db
        .delete(webauthnCredentials)
        .where(eq(webauthnCredentials.id, parseInt(id)));

      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting credential:', error);
      return res.status(500).json({ error: 'Failed to delete credential' });
    }
  },
};
