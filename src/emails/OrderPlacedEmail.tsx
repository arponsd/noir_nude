import * as React from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import {
  accentBarStyle,
  bodyStyle,
  buttonStyle,
  containerStyle,
  footerTextStyle,
  formatBDT,
  headingStyle,
  hrStyle,
  mutedStyle,
  subheadingStyle,
  textStyle,
  type EmailAddress,
  type EmailOrderItem,
} from "./_shared";

/**
 * Order placed email. The required prop surface is kept backward compatible
 * with `sendOrderPlacedEmail` in `src/lib/services/email.ts`; `items` and
 * `shippingAddress` are optional enrichments rendered when the sender passes
 * them.
 */
export type OrderPlacedEmailProps = {
  orderNumber: string;
  customerName: string;
  /** Pre-formatted total (e.g. "৳1,250.00"). */
  total: string;
  orderUrl: string;
  items?: EmailOrderItem[];
  shippingAddress?: EmailAddress;
};

export function OrderPlacedEmail({
  orderNumber,
  customerName,
  total,
  orderUrl,
  items,
  shippingAddress,
}: OrderPlacedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Thank you for your order — {orderNumber}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <div style={accentBarStyle} />
          <Heading style={headingStyle}>Thank you for your order</Heading>
          <Text style={textStyle}>Hi {customerName},</Text>
          <Text style={textStyle}>
            We received your order and will begin preparing it shortly. Your order number is{" "}
            <strong>{orderNumber}</strong>.
          </Text>

          <Button href={orderUrl} style={buttonStyle}>
            View order
          </Button>

          {items && items.length > 0 ? (
            <>
              <Heading as="h2" style={subheadingStyle}>
                Order summary
              </Heading>
              <Section>
                {items.map((item, i) => (
                  <Row key={`${item.name}-${i}`} style={{ margin: "0 0 8px" }}>
                    <Column style={{ fontSize: "14px", color: "#1a1413" }}>
                      {item.name}
                      <span style={{ color: "#5c504c" }}> × {item.quantity}</span>
                    </Column>
                    <Column
                      align="right"
                      style={{ fontSize: "14px", color: "#1a1413", whiteSpace: "nowrap" }}
                    >
                      {formatBDT(item.price * item.quantity)}
                    </Column>
                  </Row>
                ))}
                <Hr style={hrStyle} />
              </Section>
            </>
          ) : null}

          <Row>
            <Column style={{ fontSize: "15px", fontWeight: 600, color: "#1a1413" }}>Total</Column>
            <Column align="right" style={{ fontSize: "15px", fontWeight: 600, color: "#1a1413" }}>
              {total}
            </Column>
          </Row>

          {shippingAddress ? (
            <>
              <Heading as="h2" style={subheadingStyle}>
                Shipping to
              </Heading>
              <Text style={textStyle}>
                {shippingAddress.recipientName}
                <br />
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 ? (
                  <>
                    <br />
                    {shippingAddress.addressLine2}
                  </>
                ) : null}
                <br />
                {shippingAddress.city}, {shippingAddress.district} {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
                {shippingAddress.phone ? (
                  <>
                    <br />
                    {shippingAddress.phone}
                  </>
                ) : null}
              </Text>
            </>
          ) : null}

          <Text style={mutedStyle}>
            Payment method: Cash on delivery. You will pay the courier when your order arrives.
          </Text>

          <Text style={footerTextStyle}>
            Questions? Reply to this email and our team will help. GlowCart Bangladesh.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderPlacedEmail;
