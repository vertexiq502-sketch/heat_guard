import { Router } from 'express';
import { authService } from '../services/auth.service';

export const authRoutes = Router();

/**
 * Send Demo OTP endpoint (Pre-validates worker phone and prepares demo OTP 1234)
 */
authRoutes.post('/send-demo-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const result = await authService.sendDemoOtp(phone);
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({
      error: error.code || 'ERROR',
      message: error.message
    });
  }
});

/**
 * Verify Demo OTP endpoint (Validates fixed OTP 1234 and establishes Supabase session)
 */
authRoutes.post('/verify-demo-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const result = await authService.verifyDemoOtpAndLogin(phone, otp);
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({
      error: error.code || 'ERROR',
      message: error.message
    });
  }
});

/**
 * Password login supporting both phone and email with Supabase session return
 */
authRoutes.post('/password-login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const result = await authService.loginWithPassword(identifier, password);
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 400;
    res.status(statusCode).json({
      error: error.code || 'ERROR',
      message: error.message
    });
  }
});

/**
 * Backward compatibility route
 */
authRoutes.post('/login', async (req, res) => {
  try {
    const identifier = req.body.email || req.body.identifier;
    const result = await authService.loginWithPassword(identifier, req.body.password);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});