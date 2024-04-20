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

  const processAsStrictOrder = (id: number, size: number): void => {
    /////if a strict order - process it right away

    const masksOfNeededSize: Masks | undefined = findMaskOfNeededSize(size);
    //////can't resolve this entire order

    if (!masksOfNeededSize) {
      console.log("in false");

      throw false;
    }

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
        ///find optional order with any size that became out of stock
        const ordersOutOfSize: OptionalOrder[] = optionalOrders.filter(
          (order) =>
            order.size.find((size) => {
              return size === masks.size;
            })
        );

        if (ordersOutOfSize.length > 0) {
          ordersOutOfSize.forEach((optionalOrder) => {
            const availableSize: number | undefined = optionalOrder.size.find(
              (size) => size != masks.size
            );
            const id = optionalOrder.id;
            if (!availableSize) {
              throw new Error(
                "one of the sizes of optionalOrder doesn't exist"
              );
            }

            ///TODO: optimize index - can find it at the beggining in the filter
            if (getPrioritySize(optionalOrder) != availableSize) {
              result.mismatches++;
            }
            deleteOptionalOrderFrom(optionalOrders, id);
            ///delete processed as strict orders from optional orders arrays
            processAsStrictOrder(id, availableSize);
          });
        }
      }
    };
    /////add new stats to result or push quantity in the existing one
    const stats: Masks | undefined = result.stats.find(
      (stat) => stat.size === size
    );
    stats ? stats.quantity++ : result.stats.push({ size: size, quantity: 1 });

    /////take some masks from the store
    decrementQuantity(masksOfNeededSize);

    /////add new assignment to the result
    result.assignment.push({
      id: id,
      size: size,
    });
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
  const deleteOptionalOrderFrom = (array: OptionalOrder[], id: number) => {
    array.splice(
      array.findIndex((order) => id === order.id),
      1
    );
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

    const clearEndsOfCluster = (cluster: OptionalOrder[]) => {
      const resetClusterEndings = (start: boolean): OptionalOrder[] => {
        const clusterPosition = start
          ? cluster[0]
          : cluster[cluster.length - 1];
        const masterSize = start ? "s1" : "s2";
        return cluster.filter(
          (order) =>
            order.size[0] === clusterPosition.size[0] &&
            order.masterSize === masterSize
        );
      };
      let startEdgeOrders: OptionalOrder[] = resetClusterEndings(true);
      let endEdgeOrders: OptionalOrder[] = resetClusterEndings(false);

      const processEdgeOrder = (start: boolean) => {
        for (let edgeOrder of start ? startEdgeOrders : endEdgeOrders) {
          const id = edgeOrder.id;
          const size = edgeOrder.size[0];
          deleteOptionalOrderFrom(cluster, id);
          start
            ? (startEdgeOrders = resetClusterEndings(true))
            : (endEdgeOrders = resetClusterEndings(false));
          deleteOptionalOrderFrom(optionalOrders, id);
          processAsStrictOrder(id, size);
        }
      };
      while (startEdgeOrders.length > 0) {
        processEdgeOrder(true);
      }
      while (endEdgeOrders.length > 0) {
        processEdgeOrder(false);
      }
    };

    const getHottnessOfSize = (size: number, cluster: OptionalOrder[]) => {
      const demand: number =
        cluster.length === 0
          ? 0
          : cluster.filter((order) => {
              return size === getPrioritySize(order);
            }).length;
      const supply: number | undefined = store.find(
        (mask) => mask.size === size
      )?.size;
      if (!supply || demand === 0) {
        return 0;
      }
      return demand / supply;
    };
    const findHottestSize = (cluster: OptionalOrder[]) => {
      const sortedByHottness = [...cluster].sort((a, b) => {
        return (
          getHottnessOfSize(getPrioritySize(b), cluster) -
          getHottnessOfSize(getPrioritySize(a), cluster)
        );
      });
      return getPrioritySize(sortedByHottness[0]);
    };
    const getSideHottness = (
      cluster: OptionalOrder[],
      hottestSize: number,
      direction: number
    ) => {
      return cluster.find(
        (order) =>
          order.size[0] === hottestSize + direction ||
          order.size[1] === hottestSize + direction
      )
        ? getHottnessOfSize(hottestSize + direction, cluster)
        : 0;
    };

    const clusterizeOptionalOrders = () => {
      const optionalOrderClusters: OptionalOrder[][] = [];
      optionalOrders.sort((a, b) => a.size[0] - b.size[0]);
      for (let optionalOrder of optionalOrders) {
        if (optionalOrderClusters.length === 0) {
          optionalOrderClusters.push([optionalOrder]);
        } else {
          const lastCluster: OptionalOrder[] =
            optionalOrderClusters[optionalOrderClusters.length - 1];
          const gap: boolean =
            optionalOrder.size[0] -
              lastCluster[lastCluster.length - 1].size[0] >
            2;
          if (gap) {
            optionalOrderClusters.push([optionalOrder]);
          } else {
            lastCluster.push(optionalOrder);
          }
        }
      }

      const checkNeighbour = (
        neighbourDistance: number,
        cluster: OptionalOrder[]
      ) => {
        const hottestSize = findHottestSize(cluster);
        const rightHottness = getSideHottness(
          cluster,
          hottestSize,
          neighbourDistance
        );
        const leftHottness = getSideHottness(
          cluster,
          hottestSize,
          -neighbourDistance
        );
        console.log(hottestSize);
        console.log(cluster);
        // console.log(rightHottness);
        // console.log(leftHottness);
        const hottestNeighbour = rightHottness - leftHottness;

        const goWithSideOrder = (left: boolean) => {
          const optionalOrder = left
            ? cluster.find(
                (order) =>
                  order.size[0] === hottestSize - 1 &&
                  order.size[1] === hottestSize
              )
            : cluster.find(
                (order) =>
                  order.size[0] === hottestSize &&
                  order.size[1] === hottestSize + 1
              );
          if (!optionalOrder) {
            left
              ? () => {
                  throw Error("left order is undefined");
                }
              : goWithSideOrder(true);
          } else {
            const id = optionalOrder.id;
            const size = getPrioritySize(optionalOrder);
            deleteOptionalOrderFrom(cluster, id);
            deleteOptionalOrderFrom(optionalOrders, id);
            processAsStrictOrder(id, size);
          }
        };

        if (hottestNeighbour > 0) {
          goWithSideOrder(false);
          return;
        } else if (hottestNeighbour < 0) {
          goWithSideOrder(true);
          return;
        } else {
          cluster.length / 2 <= neighbourDistance
            ? goWithSideOrder(true)
            : checkNeighbour(neighbourDistance + 1, cluster);
          return;
        }
      };

      for (let cluster of optionalOrderClusters) {
        clearEndsOfCluster(cluster);
        if (cluster.length === 0) {
          break;
        }
        checkNeighbour(1, cluster);
      }
    };
    while (optionalOrders.length > 0) {
      clusterizeOptionalOrders();
    }
  } catch (e) {
    if (e === false) {
      console.log("can't process order");
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
