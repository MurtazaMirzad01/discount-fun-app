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
    operations.push({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [
              {
                orderSubtotal: {
                  excludedCartLineIds: [],
                },
              },
            ],
            value: {
              percentage: {
                value: 10,
              },
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
      const discountPercentage = getDiscountPercentageForQuantity(line.quantity);

      if (!discountPercentage) {
        continue;
      }

      productCandidates.push({
        message: `${discountPercentage}% OFF PRODUCT`,
        targets: [
          {
            cartLine: {
              id: line.id,
            },
          },
        ],
        value: {
          percentage: {
            value: discountPercentage,
          },
        },
      });
    }

    if (productCandidates.length > 0) {
      operations.push({
        productDiscountsAdd: {
          candidates: productCandidates,
          selectionStrategy: ProductDiscountSelectionStrategy.First,
        },
      });
    }
  }

  return {
    operations,
  };
}


function getDiscountPercentageForQuantity(quantity) {
  if (quantity === 4) {
    return 20;
  }
  if (quantity === 6) {
    return 30;
  }
  if (quantity === 8) {
    return 40;
  }

  return null;
}
