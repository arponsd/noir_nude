import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export type PasswordResetProps = {
  resetUrl: string;
  name?: string;
};

export function PasswordReset({ resetUrl, name }: PasswordResetProps) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return (
    <Html>
      <Head />
      <Preview>Reset your GlowCart password</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Reset your password</Heading>
          <Text style={textStyle}>{greeting}</Text>
          <Text style={textStyle}>
            We received a request to reset your GlowCart password. Click the button below to choose
            a new one. This link expires in 1 hour and can only be used once.
          </Text>
          <Button href={resetUrl} style={buttonStyle}>
            Reset password
          </Button>
          <Text style={mutedStyle}>
            If the button does not work, paste this URL into your browser:
          </Text>
          <Text style={linkStyle}>{resetUrl}</Text>
          <Text style={mutedStyle}>
            If you did not request a password reset, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordReset;

const bodyStyle = { backgroundColor: "#faf7f5", fontFamily: "Inter, Arial, sans-serif" };
const containerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "40px auto",
  maxWidth: "560px",
  padding: "32px",
};
const headingStyle = { color: "#1f1f1f", fontSize: "24px", margin: "0 0 16px" };
const textStyle = { color: "#1f1f1f", fontSize: "15px", lineHeight: "22px", margin: "0 0 16px" };
const mutedStyle = { color: "#6b6b6b", fontSize: "13px", lineHeight: "20px", margin: "16px 0 8px" };
const linkStyle = { color: "#b45977", fontSize: "13px", wordBreak: "break-all" as const };
const buttonStyle = {
  backgroundColor: "#b45977",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 600,
  padding: "12px 24px",
  textDecoration: "none",
};
