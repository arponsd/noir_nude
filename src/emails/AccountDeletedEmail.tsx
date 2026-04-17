import * as React from "react";
import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import {
  accentBarStyle,
  bodyStyle,
  containerStyle,
  footerTextStyle,
  headingStyle,
  mutedStyle,
  textStyle,
} from "./_shared";

export type AccountDeletedEmailProps = {
  customerName: string;
};

export function AccountDeletedEmail({ customerName }: AccountDeletedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your GlowCart account has been deleted</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={accentBarStyle} />
          <Heading style={headingStyle}>Your account has been deleted</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Your GlowCart account and personal data have been removed as requested. Your reviews and
            saved preferences have also been cleared.
          </Text>
          <Text style={textStyle}>
            Any prior orders are retained in an anonymised form for accounting and tax compliance,
            per our privacy policy — this is a legal requirement for retailers in Bangladesh.
          </Text>
          <Text style={mutedStyle}>
            We are sorry to see you go. You can always create a new account in the future.
          </Text>
          <Text style={footerTextStyle}>GlowCart Bangladesh.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AccountDeletedEmail;
