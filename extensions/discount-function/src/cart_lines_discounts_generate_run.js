import {
  DiscountClass,
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
} from '../generated/api';

/**
  * @typedef {import("../generated/api").CartInput} RunInput
  * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
  */

/**
  * @param {RunInput} input
  * @returns {CartLinesDiscountsGenerateRunResult}
  */

export function cartLinesDiscountsGenerateRun(input) {
  if (!input.cart.lines.length) {
    return { operations: [] };
  }

  const hasOrderDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Order,
  );
  const hasProductDiscountClass = input.discount.discountClasses.includes(
    DiscountClass.Product,
  );

  if (!hasOrderDiscountClass && !hasProductDiscountClass) {
    return { operations: [] };
  }

  /** @type {CartLinesDiscountsGenerateRunResult["operations"]} */
  const operations = [];


  if (hasOrderDiscountClass) {
    const giftCardLineIds = input.cart.lines
      .filter(
        line =>
          line.merchandise.__typename === "ProductVariant" &&
          line.merchandise.product.isGiftCard
      )
      .map(line => line.id);

    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: giftCardLineIds,
                },
              },
            ],
            value: {
              percentage: { value: 10 },
            },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });

  }

  if (hasProductDiscountClass) {
    const productCandidates = [];

    for (const line of input.cart.lines) {
      if (
        line.merchandise.__typename !== "ProductVariant" ||
        line.merchandise.product.isGiftCard
      ) {
        continue; // Skip gift cards
      }

      const discountPercentage =
        getDiscountPercentageForQuantity(line.quantity);

      if (!discountPercentage) continue;

      productCandidates.push(
        {
          message: `${discountPercentage}% OFF PRODUCT`,
          targets: [{ cartLine: { id: line.id } }],
          value: {
            percentage: { value: discountPercentage },
          },
        });
    }

    if (productCandidates.length > 0) {
      operations.push(
        {
          productDiscountsAdd: {
            candidates: productCandidates,
            selectionStrategy: ProductDiscountSelectionStrategy.All,
          },
        });
    }
  }

  return {
    operations,
  };
}


function getDiscountPercentageForQuantity(quantity) {
  if (quantity === 3) {
    return 20;
  }
  if (quantity === 5) {
    return 30;
  }
  if (quantity === 7) {
    return 40;
  }

  return null;
}
