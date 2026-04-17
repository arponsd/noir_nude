import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import {
  addCartItemSchema,
  updateCartItemSchema,
  applyCouponSchema,
  wishlistToggleSchema,
  addressInputSchema,
  addressUpdateSchema,
  placeOrderSchema,
  guestPlaceOrderSchema,
  cancelOrderSchema,
  ADDRESS_LABELS,
} from "@/lib/validators/commerce";

function oid(): string {
  return new Types.ObjectId().toString();
}

const validAddressBase = () => ({
  label: "home" as const,
  recipientName: "Alia Ahmed",
  phone: "+8801712345678",
  addressLine1: "House 12, Road 4",
  city: "Dhaka",
  district: "Dhaka",
  postalCode: "1212",
  country: "BD",
});

describe("addCartItemSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = addCartItemSchema.parse({
      productId: oid(),
      variantId: oid(),
      quantity: 2,
    });
    expect(parsed.quantity).toBe(2);
  });

  it("rejects extra keys (.strict)", () => {
    expect(() =>
      addCartItemSchema.parse({
        productId: oid(),
        variantId: oid(),
        quantity: 1,
        sneaky: true,
      }),
    ).toThrow();
  });

  it("quantity must be integer 1-99", () => {
    expect(() =>
      addCartItemSchema.parse({ productId: oid(), variantId: oid(), quantity: 0 }),
    ).toThrow();
    expect(() =>
      addCartItemSchema.parse({ productId: oid(), variantId: oid(), quantity: 100 }),
    ).toThrow();
    expect(() =>
      addCartItemSchema.parse({ productId: oid(), variantId: oid(), quantity: 1.5 }),
    ).toThrow();
  });

  it("productId / variantId must be ObjectIds", () => {
    expect(() =>
      addCartItemSchema.parse({ productId: "not-an-id", variantId: oid(), quantity: 1 }),
    ).toThrow();
  });
});

describe("updateCartItemSchema", () => {
  it("accepts quantity 1-99", () => {
    expect(updateCartItemSchema.parse({ quantity: 1 }).quantity).toBe(1);
    expect(updateCartItemSchema.parse({ quantity: 99 }).quantity).toBe(99);
  });

  it("rejects quantity 0 (public schema — see route for qty=0 path)", () => {
    expect(() => updateCartItemSchema.parse({ quantity: 0 })).toThrow();
  });

  it("rejects extras", () => {
    expect(() => updateCartItemSchema.parse({ quantity: 1, extra: "x" })).toThrow();
  });
});

describe("applyCouponSchema", () => {
  it("upper-cases the code and trims", () => {
    const parsed = applyCouponSchema.parse({ code: "  welcome10  " });
    expect(parsed.code).toBe("WELCOME10");
  });

  it("min 1, max 24 chars", () => {
    expect(() => applyCouponSchema.parse({ code: "" })).toThrow();
    expect(() => applyCouponSchema.parse({ code: "X".repeat(25) })).toThrow();
  });

  it("rejects extras", () => {
    expect(() => applyCouponSchema.parse({ code: "WELCOME10", other: 1 })).toThrow();
  });
});

describe("wishlistToggleSchema", () => {
  it("accepts productId only", () => {
    const parsed = wishlistToggleSchema.parse({ productId: oid() });
    expect(parsed.productId).toBeTypeOf("string");
    expect(parsed.variantId).toBeUndefined();
  });

  it("accepts productId + variantId", () => {
    const parsed = wishlistToggleSchema.parse({ productId: oid(), variantId: oid() });
    expect(parsed.variantId).toBeTypeOf("string");
  });

  it("rejects invalid ObjectId", () => {
    expect(() => wishlistToggleSchema.parse({ productId: "bad" })).toThrow();
  });

  it("rejects extras", () => {
    expect(() => wishlistToggleSchema.parse({ productId: oid(), extra: 1 })).toThrow();
  });
});

describe("addressInputSchema", () => {
  it("accepts the canonical shape and defaults country+label", () => {
    const { label, ...noLabel } = validAddressBase();
    // reason: assert label default applies.
    void label;
    const parsed = addressInputSchema.parse(noLabel);
    expect(parsed.label).toBe("home");
    expect(parsed.country).toBe("BD");
  });

  it("enforces label enum (home|office|other)", () => {
    for (const l of ADDRESS_LABELS) {
      expect(addressInputSchema.parse({ ...validAddressBase(), label: l }).label).toBe(l);
    }
    expect(() =>
      addressInputSchema.parse({ ...validAddressBase(), label: "billing" as unknown as "home" }),
    ).toThrow();
  });

  it("phone must be E.164", () => {
    expect(() => addressInputSchema.parse({ ...validAddressBase(), phone: "abc" })).toThrow();
    // Leading '0' rejected — E.164 first digit must be 1-9.
    expect(() =>
      addressInputSchema.parse({ ...validAddressBase(), phone: "01712345678" }),
    ).toThrow();
    // `+` prefix optional per the regex (`/^\+?[1-9]\d{1,14}$/`).
    expect(() =>
      addressInputSchema.parse({ ...validAddressBase(), phone: "8801712345678" }),
    ).not.toThrow();
  });

  it("country is 2 letters and upper-cased", () => {
    const parsed = addressInputSchema.parse({ ...validAddressBase(), country: "bd" });
    expect(parsed.country).toBe("BD");
    expect(() => addressInputSchema.parse({ ...validAddressBase(), country: "BGD" })).toThrow();
  });

  it("rejects extras", () => {
    expect(() =>
      addressInputSchema.parse({ ...validAddressBase(), notes: "please call first" }),
    ).toThrow();
  });
});

describe("addressUpdateSchema", () => {
  it("allows partial updates", () => {
    expect(addressUpdateSchema.parse({ city: "Chattogram" }).city).toBe("Chattogram");
    expect(addressUpdateSchema.parse({})).toEqual({});
  });

  it("rejects extras", () => {
    expect(() => addressUpdateSchema.parse({ foo: 1 })).toThrow();
  });
});

describe("placeOrderSchema", () => {
  it("accepts addressId only", () => {
    const parsed = placeOrderSchema.parse({ addressId: oid() });
    expect(parsed.addressId).toBeTypeOf("string");
  });

  it("upper-cases couponCode", () => {
    const parsed = placeOrderSchema.parse({ addressId: oid(), couponCode: "welcome10" });
    expect(parsed.couponCode).toBe("WELCOME10");
  });

  it("rejects extras", () => {
    expect(() => placeOrderSchema.parse({ addressId: oid(), amount: 100 })).toThrow();
  });

  it("notes is capped at 500", () => {
    expect(() => placeOrderSchema.parse({ addressId: oid(), notes: "x".repeat(501) })).toThrow();
  });
});

describe("guestPlaceOrderSchema", () => {
  it("requires at least one item", () => {
    expect(() =>
      guestPlaceOrderSchema.parse({
        guestEmail: "g@example.com",
        phone: "+8801712345678",
        shippingAddress: validAddressBase(),
        items: [],
      }),
    ).toThrow();
  });

  it("accepts a valid payload", () => {
    const parsed = guestPlaceOrderSchema.parse({
      guestEmail: "G@Example.com ",
      phone: "+8801712345678",
      shippingAddress: validAddressBase(),
      items: [{ productId: oid(), variantId: oid(), quantity: 1 }],
    });
    expect(parsed.guestEmail).toBe("g@example.com");
  });

  it("rejects extras", () => {
    expect(() =>
      guestPlaceOrderSchema.parse({
        guestEmail: "g@example.com",
        phone: "+8801712345678",
        shippingAddress: validAddressBase(),
        items: [{ productId: oid(), variantId: oid(), quantity: 1 }],
        rogue: true,
      }),
    ).toThrow();
  });
});

describe("cancelOrderSchema", () => {
  it("reason min 5 max 500", () => {
    expect(() => cancelOrderSchema.parse({ reason: "bad" })).toThrow();
    expect(cancelOrderSchema.parse({ reason: "changed my mind" }).reason).toBe("changed my mind");
    expect(() => cancelOrderSchema.parse({ reason: "x".repeat(501) })).toThrow();
  });

  it("rejects extras", () => {
    expect(() => cancelOrderSchema.parse({ reason: "changed my mind", other: 1 })).toThrow();
  });
});
