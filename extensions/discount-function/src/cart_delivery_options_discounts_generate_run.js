import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

/**
  * @typedef {import("../generated/api").DeliveryInput} RunInput
  * @typedef {import("../generated/api").CartDeliveryOptionsDiscountsGenerateRunResult} CartDeliveryOptionsDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartDeliveryOptionsDiscountsGenerateRunResult}
  */

export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const groups = input.cart.deliveryGroups;
  if (!groups || groups.length === 0) {
    return { operations: [] };
  }

  // Check if shipping discount is allowed
  const hasShippingDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Shipping
  );

  if (!hasShippingDiscountClass) {
    return { operations: [] };
  }

  const candidates = [];

  for (const group of groups) {
    if (!group.deliveryAddress || !group.deliveryAddress.countryCode) continue;

    const countryCode = group.deliveryAddress.countryCode;

    let discountValue;
    let message;

    if (countryCode === "US") {
      discountValue = 100; // free shipping
      message = "FREE shipping (US)";
    } else {
      discountValue = 50; // 50% discount
      message = "50% shipping discount";
    }

    candidates.push({
      message,
      targets: [{ deliveryGroup: { id: group.id } }],
      value: { percentage: { value: discountValue } },
    });
  }

  if (candidates.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates,
          selectionStrategy: DeliveryDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}
