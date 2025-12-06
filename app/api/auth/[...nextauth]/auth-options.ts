import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/drive.file', // Upload and manage app files
            'https://www.googleapis.com/auth/drive.appdata', // App-specific data
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Always redirect to Command Center (/) after sign-in
      return baseUrl + '/'
    },
    async session({ session, token }) {
      // Add access token to session for Google API calls
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string
      }
      if (token.email) {
        session.user.email = token.email
        // CRITICAL: Use email as user_id for database consistency
        session.user.id = token.email as string
      }
      return session
    },
    async jwt({ token, account, user }) {
      // Store access token and refresh token
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
      }
      if (user) {
        token.email = user.email
        token.name = user.name
        token.picture = user.image
        
        // AUTO-CREATE USER IN DATABASE ON FIRST SIGN-IN
        console.log('🔧 Creating/updating user in database:', user.email)
        try {
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          )
          
          // Create a users table entry (using email as user_id)
          const { error } = await supabase
            .from('domains')
            .upsert({
              user_id: user.email!,
              domain_name: 'profile',
              data: {
                name: user.name,
                email: user.email,
                image: user.image,
                created_at: new Date().toISOString()
              },
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,domain_name' })
          
          if (error) {
            console.error('❌ Error creating user profile:', error)
          } else {
            console.log('✅ User profile created/updated in database')
          }
        } catch (error) {
          console.error('❌ Error in user creation:', error)
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
}

