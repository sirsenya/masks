export type Store = Array<{
  size: number;
  quantity: number;
}>; //склад на котором лежат маски разных размеров. Лучше бы конечно это была мапа

export type Order = Array<
  | {
      id: number; //ид покупателя
      size: [number]; // размер
    }
  | {
      id: number; //ид покупателя
      size: [number, number]; //второй размер, если он есть, на единицу больше первого.
      masterSize: "s1" | "s2"; //приоритетный размер
    }
>;

export type Result = {
  stats: Array<{ size: number; quantity: number }>; //отсортированный по возрастанию размеров массив, содержащий информацию о выданных размерах и их кол-ве;
  assignment: Array<{ id: number; size: number }>; //массив, содержащий сведения о том, кто какой размер получил
  mismatches: number; //кол-во покупателей, у которых выданный размер НЕ совпал с приоритетным.
};
