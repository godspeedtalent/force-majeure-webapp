import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface SignupConfirmationEmailProps {
  confirmation_url: string
  display_name: string
}

export const SignupConfirmationEmail = ({
  confirmation_url,
  display_name,
}: SignupConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the Force Majeure Rave Fam! Confirm your email to continue.</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoContainer}>
          <Text style={logo}>⚡ FORCE MAJEURE ⚡</Text>
        </div>
        
        <Heading style={h1}>Welcome to the Rave Fam, {display_name}!</Heading>
        
        <Text style={text}>
          You're one step away from claiming your free tickets in the LF System Scavenger Hunt.
        </Text>

        <Text style={text}>
          Click the button below to confirm your email and complete your registration:
        </Text>

        <div style={buttonContainer}>
          <Link
            href={confirmation_url}
            target="_blank"
            style={button}
          >
            Confirm Email & Join the Hunt
          </Link>
        </div>

        <Text style={textSmall}>
          Or copy and paste this link into your browser:
        </Text>
        <Text style={link}>{confirmation_url}</Text>

        <Hr style={hr} />

        <Text style={footer}>
          If you didn't sign up for the Force Majeure Scavenger Hunt, you can safely ignore this email.
        </Text>

        <Text style={footerBrand}>
          <strong>FORCE MAJEURE</strong> • Where the beats never stop
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupConfirmationEmail

const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  backgroundColor: '#1a1a1a',
  border: '2px solid #d4af37',
}

const logoContainer = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#d4af37',
  letterSpacing: '2px',
  margin: '0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: 'bold',
  marginBottom: '24px',
  textAlign: 'center' as const,
  lineHeight: '1.4',
}

const text = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '1.6',
  marginBottom: '16px',
}

const textSmall = {
  color: '#999999',
  fontSize: '14px',
  lineHeight: '1.6',
  marginTop: '24px',
  marginBottom: '8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#d4af37',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  padding: '16px 32px',
  borderRadius: '4px',
  display: 'inline-block',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}

const link = {
  color: '#d4af37',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  marginBottom: '24px',
}

const hr = {
  borderColor: '#333333',
  margin: '32px 0',
}

const footer = {
  color: '#999999',
  fontSize: '14px',
  lineHeight: '1.6',
  marginTop: '24px',
  textAlign: 'center' as const,
}

const footerBrand = {
  color: '#d4af37',
  fontSize: '14px',
  textAlign: 'center' as const,
  marginTop: '16px',
  fontWeight: 'bold',
  letterSpacing: '1px',
}
