// ========================================================================= //
// ============================== Auth Plugin ============================== //
// ========================================================================= //

import { betterAuthPlugin } from 'payload-auth'
import { nextCookies } from 'better-auth/next-js'
import { admin } from 'better-auth/plugins/admin'
import { magicLink } from 'better-auth/plugins/magic-link'
import { getMagicLinkEmailHtml } from '@/emails/MagicLinkEmail'
import { Resend } from 'resend'
// Avoid dependency on html-entities; keep minimal behavior
const decode = (s: string) => s

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~ Plugin Definition ~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

const resend = new Resend(process.env.RESEND_API_KEY ?? 'dummy-key')

const sendEmailWithoutPayloadConfigDependency = async (
  message: string,
  to: string,
  subject: string,
) => {
  try {
    // 💡 Dev-only logging of email HTML content
    // if (process.env.NODE_ENV === 'development') { //
    const linkRegex = /href="([^"]+)"/g
    const links: string[] = []
    let match
    while ((match = linkRegex.exec(message)) !== null) {
      links.push(match[1])
    }

    const noFontLinks = links.filter((url) => !/^https?:\/\/fonts\./.test(url))

    const uniqueLinks = Array.from(new Set(noFontLinks))
    const decodedLinks = uniqueLinks.map((link) => link)

    if (decodedLinks.length > 0) {
      console.log('\n🔗 Links found in email:')
      decodedLinks.forEach((link, i) => {
        console.log(`${i + 1}. ${decode(link)}`)
      })
      console.log('')
    } else {
      console.log('\nℹ️ No links found in email.\n')
    }
    await resend.emails.send({
      from: 'no-reply@alfitutor.com',
      to,
      subject,
      html: message,
    })
  } catch (error) {
    throw new Error(
      '[sendEmailWithoutPayloadConfigDependency] Error : ' +
        (error instanceof Error ? error.message : String(error)),
    )
  }
}

export const auth = betterAuthPlugin({
  disabled: false,
  disableDefaultPayloadAuth: true,
  hidePluginCollections: false,
  users: {
    slug: 'payload-users',
    allowedFields: ['name'],
    defaultRole: 'user',
    defaultAdminRole: 'admin',
  },
  accounts: {
    slug: 'payload-users-accounts',
  },
  sessions: {
    slug: 'payload-users-sessions',
  },
  verifications: {
    slug: 'payload-verifications',
  },
  pluginCollectionOverrides: {
    organizations: ({ collection }) => {
      return {
        ...collection,
        slug: 'payload-organisations',
      }
    },
  },
  betterAuthOptions: {
    appName: 'ns-webapp',
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
    trustedOrigins: [process.env.NEXT_PUBLIC_SERVER_URL!],
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      requireEmailVerification: false,
    },
    /* socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    }, */
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'user',
          input: false,
        },
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache duration in seconds
      },
    },
    /*  account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    }, */
    plugins: [
      admin(),
      nextCookies(),
      /* magicLink({
        // disableSignUp: true,
        sendMagicLink: async ({ email, token, url }, request) => {
          const magicLinkHtml = await getMagicLinkEmailHtml({
            magicLink: url,
          })
          // use this action to avoid circular dependencies
          await sendEmailWithoutPayloadConfigDependency(
            magicLinkHtml,
            email,
            'Connect to Alfi Tutor',
          )
        },
      }), */
    ],
  },
})
