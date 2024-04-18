import { type Result, type Order, type Store } from "./types";

type Masks = {
  size: number;
  quantity: number;
};

type StrictOrder = { id: number; size: [number] };

type OptionalOrder = {
  id: number;
  size: [number, number];
  masterSize: "s1" | "s2";
};

export const process = (store: Store, order: Order): false | Result => {
  const optionalOrders: Order = [];
  const result: Result = {
    stats: [],
    assignment: [],
    mismatches: 0,
  };

  const findMaskOfNeededSize = (size: number): Masks | undefined =>
    store.find((masks) => masks.size === size && masks.quantity > 0);

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
  const optionalSizesNeeded: number[][] = [];

  const processAsStrictOrder = (id: number, size: number) => {
    /////if a strict order - process it right away
    const currentStrictOrderSize = size;
    const masksOfNeededSize: Masks | undefined = findMaskOfNeededSize(
      currentStrictOrderSize
    );
    //////can't resolve this entire order
    if (!masksOfNeededSize) {
      throw false;
    }
    amendResult(masksOfNeededSize, id, currentStrictOrderSize);
  };

  ///TODO: function for decrementing quantity in stock
  ///after decrementing, if it decremented to zero it should check the array of optional orders for
  /// orders that have this size as primary or secondary and process
  ///these optionalOrders as strict orders rigth away

  const preCheckOptionalOrder = (
    prioritySize: number,
    secondarySize: number,
    currentOrder: OptionalOrder
  ): void | false => {
    const prioritySizeInStore = findMaskOfNeededSize(prioritySize);
    const secondarySizeInStore = findMaskOfNeededSize(secondarySize);
    // console.log(
    //   "currentOrder.masterSize!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    // );
    // console.log(currentOrder.masterSize);
    console.log(prioritySizeInStore);
    console.log(secondarySize);
    if (!prioritySizeInStore && !secondarySizeInStore) {
      throw false;
    } else if (prioritySizeInStore && !secondarySizeInStore) {
      processAsStrictOrder(currentOrder.id, prioritySize);
    } else if (secondarySizeInStore && !prioritySizeInStore) {
      result.mismatches++;
      processAsStrictOrder(currentOrder.id, secondarySize);
    } else {
      optionalOrders.push(currentOrder);
      optionalSizesNeeded.push([prioritySize, secondarySize]);
    }
  };

  try {
    //////sort orders by type
    for (let currentOrder of order) {
      /////if is order with mastersize
      if (Object.keys(currentOrder).includes("masterSize")) {
        ////TODO: add pre-check if already there are no sizes available for this optional order
        ////or if already only one size is available make it strictOrder.
        ////this check should be repeated after this whole itiration, since the situation might have changed
        const optionalOrder: OptionalOrder = currentOrder as OptionalOrder;
        const optionalOrderSizes: number[] = optionalOrder.size;
        const masterSize: "s1" | "s2" = optionalOrder.masterSize;
        const prioritySize: number =
          optionalOrderSizes[Number(masterSize.substring(1)) - 1];
        const secondarySize: number = optionalOrderSizes.find(
          (size) => size != prioritySize
        )!;

        preCheckOptionalOrder(prioritySize, secondarySize, optionalOrder);
      } else {
        /////If strict order
        processAsStrictOrder(currentOrder.id, currentOrder.size[0]);
      }
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    ////1. проверить можно ли всем выдать приоритетный размер
    ////2. если нельзя, то проверить, кому выдать приоритетны размер, а кому секундарный,
    ////      таким образом, чтобы приоритетных размеров всегда оставалось ноль

    //A. Посчитать требуемое количество для каждого приоритетного размера
    // {prioritySize: number, neededQuantity: number}
    //Б. Посмотреть

    const prioritySizes = optionalSizesNeeded.map((e) => e[0]);
    const secondarySizes = optionalSizesNeeded.map((e) => e[1]);
    console.log(store);
    console.log(optionalSizesNeeded);

    //////////////////////////////////////////////////////////////////////////////////////////////////////
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

      const masksOfPrioritySize: Masks | undefined =
        findMaskOfNeededSize(prioritySize);

      /////if no priority size - look for secondary size
      if (!masksOfPrioritySize) {
        const masksOfSecondarySize: Masks | undefined =
          findMaskOfNeededSize(secondarySize);
        /////if neither priority nor secondary size - can't resolve the entire order
        if (!masksOfSecondarySize) {
          return false;
        }
        /////if only secondary size is available

        /////increment mismatches
        result.mismatches++;
        amendResult(
          masksOfSecondarySize,
          currentOptionalOrder.id,
          secondarySize
        );
        break;
      }
      //// if priority size is available
      amendResult(masksOfPrioritySize, currentOptionalOrder.id, prioritySize);
    }
  } catch (e) {
    if (e === false) {
      return e;
    } else {
      console.error(e);
    }
  }
  ////stats should be sorted by sizes in ascending order
  result.stats.sort((a, b) => a.size - b.size);

  return result;
};
