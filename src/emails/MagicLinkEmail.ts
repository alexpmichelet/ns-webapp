export async function getMagicLinkEmailHtml({ magicLink }: { magicLink: string }) {
  return `<!doctype html><html><body>
  <p>Click the link below to sign in:</p>
  <p><a href="${magicLink}">Sign in</a></p>
  <p>If the button does not work, copy and paste this URL into your browser:</p>
  <p>${magicLink}</p>
  </body></html>`
}
