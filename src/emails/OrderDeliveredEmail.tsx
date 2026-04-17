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

export type OrderDeliveredEmailProps = {
  orderNumber: string;
  customerName: string;
  orderUrl: string;
  reviewUrl?: string;
};

export function OrderDeliveredEmail({
  orderNumber,
  customerName,
  orderUrl,
  reviewUrl,
}: OrderDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} has arrived</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={accentBarStyle} />
          <Heading style={headingStyle}>Your order has arrived</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            Order <strong>{orderNumber}</strong> has been delivered. We hope you love every piece.
          </Text>

          {reviewUrl ? (
            <>
              <Text style={textStyle}>
                Enjoyed your purchase? A short review helps other customers find the right products.
              </Text>
              <Button href={reviewUrl} style={buttonStyle}>
                Leave a review
              </Button>
            </>
          ) : (
            <Button href={orderUrl} style={buttonStyle}>
              View order
            </Button>
          )}

          <Text style={mutedStyle}>
            If anything is not right, reply to this email within 7 days and we will sort it.
          </Text>
          <Text style={footerTextStyle}>GlowCart Bangladesh.</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderDeliveredEmail;
