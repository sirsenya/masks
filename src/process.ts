// Необходимо написать функцию process, которая первым аргументом принимает sore: Store, вторым - order: Order
// и возвращает:
// - false, если склад не сможет обработать данный заказ (например, на складе нет подходящих размеров);
// - объект Result, если заказ можно обработать, выдав всем подходящий размер.
// ```ts
// type Result = {
//   stats: Array<{ size: number, quantity: number }>
//   assignment: Array<{ id: number, size: number }>
//   mismatches: number
// }

import { type Result, type Order, type Store } from "./types";

type Masks = {
  size: number;
  quantity: number;
};

type Assignment = {};

export const process = (store: Store, order: Order): false | Result => {
  const optionalOrders: Order = [];
  const strictOrders: Order = [];
  const result: Result = {
    stats: [],
    assignment: [],
    mismatches: 0,
  };

  //////sort orders by type
  for (let currentOrder of order) {
    if (Object.keys(currentOrder).includes("masterSize")) {
      optionalOrders.push(currentOrder);
    } else {
      strictOrders.push(currentOrder);
    }
  }

  //////manage strict orders
  for (let currentStrictOrder of strictOrders) {
    const currentStrictOrderSize = currentStrictOrder.size[0];
    const masksOfNeededSize: Masks | undefined = store.find(
      (masks) => masks.size === currentStrictOrderSize && masks.quantity > 0
    );
    //////can't resolve this entire order
    if (!masksOfNeededSize) {
      return false;
    }

    /////took some masks from the store
    masksOfNeededSize.quantity--;

    /////add new stats to result or push quantity in the existing one
    const stats: Masks | undefined = result.stats.find(
      (stat) => stat.size === currentStrictOrderSize
    );
    stats
      ? stats.quantity++
      : result.stats.push({ size: currentStrictOrderSize, quantity: 1 });

    /////add new assignment to the result
    result.assignment.push({
      id: currentStrictOrder.id,
      size: currentStrictOrderSize,
    });
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
  }

  return false;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const tests = [
  {
    store: [{ size: 2, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: true,
    mismatches: 1,
  },
  {
    store: [{ size: 3, quantity: 1 }],
    order: [{ id: 102, size: [1, 2], masterSize: "s1" }],
    isPossible: false,
    mismatches: 0,
  },
  {
    store: [{ size: 2, quantity: 4 }],
    order: [
      { id: 101, size: [2] },
      { id: 102, size: [1, 2], masterSize: "s2" },
    ],
    isPossible: true,
    mismatches: 0,
  },
  {
    store: [
      { size: 1, quantity: 1 },
      { size: 2, quantity: 2 },
      { size: 3, quantity: 1 },
    ],
    order: [
      { id: 100, size: [1] },
      { id: 101, size: [2] },
      { id: 102, size: [2, 3], masterSize: "s1" },
      { id: 103, size: [1, 2], masterSize: "s2" },
    ],
    isPossible: true,
    mismatches: 1,
  },
];
