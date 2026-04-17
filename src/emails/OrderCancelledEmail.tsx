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
  subheadingStyle,
  textStyle,
} from "./_shared";

export type OrderCancelledEmailProps = {
  orderNumber: string;
  customerName: string;
  reason: string;
  orderUrl: string;
};

export function OrderCancelledEmail({
  orderNumber,
  customerName,
  reason,
  orderUrl,
}: OrderCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} has been cancelled</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={accentBarStyle} />
          <Heading style={headingStyle}>Order cancelled</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Your order <strong>{orderNumber}</strong> has been cancelled as requested.
          </Text>

          <Heading as="h2" style={subheadingStyle}>
            Reason
          </Heading>
          <Text style={textStyle}>{reason}</Text>

          <Heading as="h2" style={subheadingStyle}>
            Refunds
          </Heading>
          <Text style={textStyle}>
            As this was a cash-on-delivery order, no payment was collected — there is nothing to
            refund. For any prepaid orders, refunds will be issued to the original payment method
            within 7 business days.
          </Text>

          <Button href={orderUrl} style={buttonStyle}>
            View order
          </Button>

          <Text style={mutedStyle}>
            Changed your mind? You can place a new order any time from your GlowCart account.
          </Text>
          <Text style={footerTextStyle}>GlowCart Bangladesh.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderCancelledEmail;
