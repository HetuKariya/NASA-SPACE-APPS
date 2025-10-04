import { oauth2Client } from "../clients/googleoauth2.clients.js";
import { supabase } from "../clients/supabase.clients.js";
import { User } from "../models/user.models.js";
import { fn, col, where } from "sequelize";
import jwt from "jsonwebtoken";

const IS_PROD = process.env.NODE_ENV !== "development";

/**
 * Step 1: Generate Google OAuth consent URL
 */
export const googleAuth = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  res.json({ url: authUrl });
};

/**
 * Step 2: Handle Google OAuth callback
 */
export const googleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.APP_CLIENT_URI}/login?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await response.json();
    const { email, id: googleId, name } = googleUser;

    // Check if user exists in our database
    let user = await User.findOne({ where: { email } });
    let supabaseUserId;

    if (user) {
      // Existing user - update OAuth providers if needed
      if (!user.oauthProviders.includes('google')) {
        user.oauthProviders = [...user.oauthProviders, 'google'];
        await user.save();
      }
      supabaseUserId = user.id;
    } else {
      // New user - create in Supabase Auth first
      const { data: supabaseData, error: supabaseError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm for OAuth users
        user_metadata: {
          name,
          provider: 'google',
          google_id: googleId
        }
      });

      if (supabaseError || !supabaseData.user) {
        throw new Error(supabaseError?.message || 'Failed to create user in Supabase');
      }

      supabaseUserId = supabaseData.user.id;

      // Generate unique username from email or name
      let username = (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      let uniqueUsername = username;
      let counter = 1;
      while (await User.findOne({ 
        where: where(fn("LOWER", col("username")), "=", uniqueUsername) 
      })) {
        uniqueUsername = `${username}${counter}`;
        counter++;
      }

      // Create user in our database
      user = await User.create({
        id: supabaseUserId,
        username: uniqueUsername,
        email,
        oauthProviders: ['google']
      });
    }

    // Generate JWT token manually
    const accessToken = jwt.sign(
      { sub: supabaseUserId, email },
      process.env.SUPABASE_JWT_SECRET,
      { expiresIn: '5m' }
    );

    // Set auth cookie
    res.cookie("authJwt", accessToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: IS_PROD ? "Strict" : "Lax",
      maxAge: 5 * 60 * 1000, // 5 min
    });

    // Redirect to frontend with success
    res.redirect(`${process.env.APP_CLIENT_URI}/?oauth=success`);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${process.env.APP_CLIENT_URI}/login?error=oauth_failed`);
  }
};