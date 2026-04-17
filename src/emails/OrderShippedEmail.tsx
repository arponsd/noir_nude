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
import {
  accentBarStyle,
  bodyStyle,
  buttonStyle,
  containerStyle,
  footerTextStyle,
  headingStyle,
  mutedStyle,
  textStyle,
} from "./_shared";

export type OrderShippedEmailProps = {
  orderNumber: string;
  customerName: string;
  trackingNumber?: string;
  courier?: string;
  orderUrl: string;
};

export function OrderShippedEmail({
  orderNumber,
  customerName,
  trackingNumber,
  courier,
  orderUrl,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} is on its way</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={accentBarStyle} />
          <Heading style={headingStyle}>Your order is on its way</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Great news — your order <strong>{orderNumber}</strong> has shipped and is en route.
          </Text>

          {courier ? (
            <Text style={textStyle}>
              <strong>Courier:</strong> {courier}
            </Text>
          ) : null}
          {trackingNumber ? (
            <Text style={textStyle}>
              <strong>Tracking number:</strong> {trackingNumber}
            </Text>
          ) : null}

          <Button href={orderUrl} style={buttonStyle}>
            Track order
          </Button>

          <Text style={mutedStyle}>
            Delivery typically takes 2-5 business days depending on your location.
          </Text>
          <Text style={footerTextStyle}>GlowCart Bangladesh.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderShippedEmail;
