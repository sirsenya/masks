import { type Result, type Order, type Store } from "./types";

type Masks = {
  size: number;
  quantity: number;
};

type OptionalOrder = {
  id: number;
  size: [number, number];
  masterSize: "s1" | "s2";
};

export const process = (store: Store, order: Order): false | Result => {
  const optionalOrders: OptionalOrder[] = [];
  const result: Result = {
    stats: [],
    assignment: [],
    mismatches: 0,
  };

  const findMaskOfNeededSize = (size: number): Masks | undefined =>
    store.find((masks) => masks.size === size && masks.quantity > 0);

  const amendResult = (
    masksOfNeededSize: Masks,
    id: number,
    size: number
  ): void => {
    /////add new stats to result or push quantity in the existing one
    const stats: Masks | undefined = result.stats.find(
      (stat) => stat.size === size
    );
    stats ? stats.quantity++ : result.stats.push({ size: size, quantity: 1 });
    if (id === 102) {
      console.log(102!!!!!!);
    }
    /////take some masks from the store
    decrementQuantity(masksOfNeededSize);
    //masksOfNeededSize.quantity--;
    if (id === 102) {
    }
    /////add new assignment to the result
    result.assignment.push({
      id: id,
      size: size,
    });
  };

  const processAsStrictOrder = (id: number, size: number): void => {
    /////if a strict order - process it right away

    const masksOfNeededSize: Masks | undefined = findMaskOfNeededSize(size);
    //////can't resolve this entire order
    if (!masksOfNeededSize) {
      throw false;
    }
    amendResult(masksOfNeededSize, id, size);
  };

  ///TODO: function for decrementing quantity in stock
  ///after decrementing, if it decremented to zero it should check the array of optional orders for
  /// orders that have this size as primary or secondary and process
  ///these optionalOrders as strict orders rigth away

  const decrementQuantity = (masks: Masks): void => {
    if (masks.quantity <= 0) {
      throw new Error(
        "someHow 0 or less qunatity masks are passed to the decrementQuantity"
      );
      //  throw false
    }
    masks.quantity--;

    /// find optional orders with a size that've
    /// just become 0 and process it as Strict order with its other
    /// size that became is the only available size now
    if (masks.quantity === 0) {
      const ordersOutOfSize: OptionalOrder[] = optionalOrders.filter((order) =>
        order.size.find((size) => {
          return size === masks.size;
        })
      );

      if (ordersOutOfSize.length > 0) {
        ordersOutOfSize.forEach((optionalOrder) => {
          const availableSize: number | undefined = optionalOrder.size.find(
            (size) => size != masks.size
          );
          if (!availableSize) {
            throw new Error("one of the sizes of optionalOrder doesn't exist");
          }

          ///TODO: optimize index - can find it at the beggining in the filter
          if (getPrioritySize(optionalOrder) != availableSize) {
            result.mismatches++;
          }
          optionalOrders.splice(
            optionalOrders.findIndex((order) => optionalOrder.id === order.id)
          );
          ///delete processed as strict orders from optional orders arrays

          processAsStrictOrder(optionalOrder.id, availableSize);
        });
      }
    }
  };

  const preCheckOptionalOrder = (optionalOrder: OptionalOrder): void => {
    const prioritySize = getPrioritySize(optionalOrder);
    const secondarySize = getSecondarySize(optionalOrder);
    const prioritySizeInStore = findMaskOfNeededSize(prioritySize);
    const secondarySizeInStore = findMaskOfNeededSize(secondarySize);
    if (!prioritySizeInStore && !secondarySizeInStore) {
      throw false;
    } else if (prioritySizeInStore && !secondarySizeInStore) {
      processAsStrictOrder(optionalOrder.id, prioritySize);
    } else if (secondarySizeInStore && !prioritySizeInStore) {
      result.mismatches++;
      processAsStrictOrder(optionalOrder.id, secondarySize);
    } else {
      optionalOrders.push(optionalOrder);
    }
  };
  const getPrioritySize = (optionalOrder: OptionalOrder): number => {
    const masterSize: "s1" | "s2" = optionalOrder.masterSize;
    const prioritySize: number =
      optionalOrder.size[Number(masterSize.substring(1)) - 1];
    return prioritySize;
  };

  const getSecondarySize = (optionalOrder: OptionalOrder) => {
    const secondarySize: number = optionalOrder.size.find(
      (size) => size != getPrioritySize(optionalOrder)
    )!;
    return secondarySize;
  };

  try {
    //////sort orders by type
    for (let currentOrder of order) {
      /////if is order with mastersize
      if (Object.keys(currentOrder).includes("masterSize")) {
        const optionalOrder: OptionalOrder = currentOrder as OptionalOrder;
        preCheckOptionalOrder(optionalOrder);
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

    const optionalSizesNeeded: number[][] = optionalOrders.map(
      (order) => order.size
    );
    const prioritySizesNeeded = optionalSizesNeeded.map((e) => e[0]);
    const secondarySizesNeeded = optionalSizesNeeded.map((e) => e[1]);
    // console.log(store);
    // console.log(optionalSizesNeeded);

    //  const conflictOfInterest = [];
    //  optionalSizesNeeded.forEach(sizeNeeded =>)

    //////////////////////////////////////////////////////////////////////////////////////////////////////
    for (let optionalOrder of optionalOrders) {
      const prioritySize = getPrioritySize(optionalOrder);
      const secondarySize = getSecondarySize(optionalOrder);
      const masksOfPrioritySize: Masks | undefined =
        findMaskOfNeededSize(prioritySize);
      /////if no priority size - look for secondary size
      if (!masksOfPrioritySize) {
        result.mismatches++;
        processAsStrictOrder(optionalOrder.id, secondarySize);
        break;
      }
      //// if priority size is available
      amendResult(masksOfPrioritySize, optionalOrder.id, prioritySize);
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
  console.log(result);
  return result;
};
