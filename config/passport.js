/**
 * Configuração do Passport.js para Google OAuth 2.0
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../database');

// Serializar usuário para a sessão
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserializar usuário da sessão
passport.deserializeUser(async (id, done) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (users.length > 0) {
      done(null, users[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Configurar estratégia do Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    proxy: true // Necessário se usar proxy reverso (como nginx)
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Verificar se o usuário já existe
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE google_id = ?',
        [profile.id]
      );

      if (existingUsers.length > 0) {
        // Usuário já existe, atualizar last_login
        const user = existingUsers[0];
        await pool.query(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );
        return done(null, user);
      }

      // Criar novo usuário
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const name = profile.displayName || 'Usuário';
      const picture = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      const [result] = await pool.query(
        'INSERT INTO users (google_id, email, name, picture, last_login) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [profile.id, email, name, picture]
      );

      const newUser = {
        id: result.insertId,
        google_id: profile.id,
        email,
        name,
        picture
      };

      return done(null, newUser);
    } catch (error) {
      console.error('Erro na autenticação Google:', error);
      return done(error, null);
    }
  }
));

module.exports = passport;
