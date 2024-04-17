import { type Result, type Order, type Store } from "./types";

type Masks = {
  size: number;
  quantity: number;
};

export const process = (store: Store, order: Order): false | Result => {
  const optionalOrders: Order = [];
  const strictOrders: Order = [];
  const result: Result = {
    stats: [],
    assignment: [],
    mismatches: 0,
  };

  const amendResult = (masksOfNeededSize: Masks, id: number, size: number) => {
    /////add new stats to result or push quantity in the existing one
    const stats: Masks | undefined = result.stats.find(
      (stat) => stat.size === size
    );
    stats ? stats.quantity++ : result.stats.push({ size: size, quantity: 1 });

    /////take some masks from the store
    masksOfNeededSize.quantity--;

    /////add new assignment to the result
    result.assignment.push({
      id: id,
      size: size,
    });
  };
  const optinalSizesNeeded: number[][] = [];

  //////sort orders by type
  for (let currentOrder of order) {
    if (Object.keys(currentOrder).includes("masterSize")) {
      const optionalOrderSizes: number[] = currentOrder.size;
      const masterSize: "s1" | "s2" = new Map(Object.entries(currentOrder)).get(
        "masterSize"
      );
      const prioritySize: number =
        optionalOrderSizes[Number(masterSize.substring(1)) - 1];
      const secondarySize: number = optionalOrderSizes.find(
        (size) => size != prioritySize
      )!;
      optionalOrders.push(currentOrder);
      optinalSizesNeeded.push([prioritySize, secondarySize]);
    } else {
      const currentStrictOrderSize = currentOrder.size[0];
      const masksOfNeededSize: Masks | undefined = store.find(
        (masks) => masks.size === currentStrictOrderSize && masks.quantity > 0
      );
      //////can't resolve this entire order
      if (!masksOfNeededSize) {
        return false;
      }
      amendResult(masksOfNeededSize, currentOrder.id, currentStrictOrderSize);
    }
  }

  for (let currentOptionalOrder of optionalOrders) {
    const optionalOrderSizes: number[] = currentOptionalOrder.size;
    const masterSize: "s1" | "s2" = new Map(
      Object.entries(currentOptionalOrder)
    ).get("masterSize");
    const prioritySize: number =
      optionalOrderSizes[Number(masterSize.substring(1)) - 1];
    const secondarySize: number = optionalOrderSizes.find(
      (size) => size != prioritySize
    )!;

    const masksOfPrioritySize: Masks | undefined = store.find(
      (masks) => masks.size === prioritySize && masks.quantity > 0
    );

    /////if no priority size - look for secondary size
    if (!masksOfPrioritySize) {
      const masksOfSecondarySize: Masks | undefined = store.find(
        (masks) => masks.size === secondarySize && masks.quantity > 0
      );
      /////if neither priority nor secondary size - can't resolve the entire order
      if (!masksOfSecondarySize) {
        return false;
      }
      /////if only secondary size is available

      /////increment mismatches
      result.mismatches++;
      amendResult(masksOfSecondarySize, currentOptionalOrder.id, secondarySize);
      break;
    }
    //// if priority size is available
    amendResult(masksOfPrioritySize, currentOptionalOrder.id, prioritySize);
  }
  ////stats should be sorted by sizes in ascending order
  result.stats.sort((a, b) => a.size - b.size);
  return result;
};
